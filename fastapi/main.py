import os
import re
#import boto3
from llama_cpp import Llama
import copy
from sse_starlette import EventSourceResponse
import requests
import uvicorn
from pymongo import MongoClient
from fastapi import FastAPI, Request, Depends
import openai
import httpx



mongo_client = MongoClient('your_mongodb_URI', 27017)
mongo_db = mongo_client["testdb1"]  # Replace <db_name> with your MongoDB database name
issue_processing_collection = mongo_db["issues"]
user_collection = mongo_db["users"]
pull_request_processing_collection = mongo_db["pullrequests"]
comment_processing_collection = mongo_db["comments"]

app = FastAPI()

@app.get("/")
async def hello():
    return {"hello": "World"}







def truncate_text(text, max_tokens):
    """Truncate text to fit within max_tokens"""
    tokens = text.split(' ') # This is a very naive tokenization
    if len(tokens) > max_tokens:
        tokens = tokens[:max_tokens]
    return ' '.join(tokens)

def truncate_text_two(text, max_chars):
    """Truncate text to fit within max_chars"""
    if len(text) > max_chars:
        text = text[:max_chars]
        # Ensure we don't truncate in the middle of a word
        last_space = text.rfind(' ')
        text = text[:last_space]
    return text



def split_text(text, chunk_size):
    """Split the text into chunks of size chunk_size"""
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]


def summarize_code(code_chunk: str) -> str:
    try:
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert software developer. Summarize the following code without losing important context."
                },
                {
                    "role": "user",
                    "content": code_chunk
                }
            ]
        )
        assistant_message = completion['choices'][0]['message']['content']
        return assistant_message.strip()

    except Exception as e:
        print(f"Error during code summarization: {str(e)}")
        return ""


async def process_large_code(code, chunk_size=1000, summary_size=100):
    """Process large code, summarize it, and return a condensed version of the code."""
    
    chunks = split_text(code, chunk_size)
    summarized_chunks = []

    for chunk in chunks:
        summary = summarize_code(chunk)  # Notice: no "await" here
        # Ensure the summary is not too long
        summarized_chunks.append(summary[:summary_size])
    
    return " ".join(summarized_chunks)



# http://127.0.0.1:8000/llama?input_text=your_input_here

@app.get("/llama")
async def llama(request : Request , input_text: str):
    stream = llm(f"Question : can you rank the difficulty of this GitHub Issue from {input_text} : 'A lot of questions have already been asked regarding resizing layer in sequential models but I couldn't find any that could solve my specific architecture. I am creating an adversarial GAN. First an image (of size 224 224 3) is input and sent through a generator that outputs a generated image of the same size. This image is then given to a discriminator and a target network (VGG16) that both expect an input of 224 224 3. Here is my current code: Output only an integer, nothing else'. Answer: ",
             max_tokens = 10 ,
             stop = ["\n", "Question :", "Q:"],
             stream = True,)
    
    async def async_generator():
        for item in stream:
            yield item

    async def server_sent_events():
        async for item in async_generator():
            if await request.is_disconnected():
                break

            result = copy.deepcopy(item)
            text = result["choices"][0]["text"]

            yield {"data": text}

    return EventSourceResponse(server_sent_events())



@app.get("/processissue")
async def llama(request : Request):
    # Find first issue with difficulty "processing"
    issue = issue_processing_collection.find_one({"difficulty": "processing"})

    if not issue:
        return {"data": "No issues to process."}

    input_text = issue['body'] # Assuming the issue body is stored in 'body' field

    if not input_text:  # if input_text is None or an empty string
        input_text = issue['title'] # Assuming the issue title is stored in 'title' field

    truncate_text(input_text, 460)

    stream = llm(f"Question : can you rank the difficulty of this GitHub Issue from 1 to 10 : {input_text}. Output only an integer, nothing else'. Answer: ",
             max_tokens = 10 ,
             stop = ["\n", "Question :", "Q:"],
             stream = True,)

    async def async_generator():
        for item in stream:
            yield item

    async def server_sent_events():
        async for item in async_generator():
            if await request.is_disconnected():
                break

            result = copy.deepcopy(item)
            text = result["choices"][0]["text"]

            # Update the issue difficulty in the issue_processing_collection
            issue_processing_collection.update_one({"_id": issue["_id"]}, {"$set": {"difficulty": text}})

            # Add/update the user's issue with the new difficulty
            user_collection.update_one(
                {"issues.issueId": issue["issueId"]}, 
                {"$set": {"issues.$.difficulty": text}}
            )

            # Delete the issue from IssueProcessing after it is processed
            issue_processing_collection.delete_one({"_id": issue["_id"]})


            yield {"data": text}

    return EventSourceResponse(server_sent_events())




@app.get("/processissuegpt")
async def process_issue(request: Request):

    # Find first issue with difficulty "processing"
    issue = issue_processing_collection.find_one({"difficulty": "processing"})

    if not issue:
        return {"data": "No issues to process."}

    input_text = issue.get('body') or issue.get('title')  # Get issue body, default to title if not found
    if not input_text:  # If both body and title are empty
        return {"data": "Issue body and title are empty."}

    input_text = truncate_text(input_text, 460)

    user_message = {
        "role": "user",
        "content": f"Rate the difficulty of this GitHub issue: '{input_text}'. Remember, your rating should be a number from 1 to 10 because it will be passed to other functions that take only integers as inputs, (if the issue is not understandable, just put 0, do not provide any textual explanation). Answer : "
    }

    try:
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior developer who specializes in evaluating GitHub issues based on their complexity. Your task is to assess the difficulty of the issues on a scale of 1 to 10, where 1 indicates a very easy issue and 10 indicates a very complex issue. If the issue is not understandable, you should give it a rating of 0. Please note that you should only provide a numerical integer score."
                },
                user_message
            ]
        )
        assistant_message = completion['choices'][0]['message']['content']

        try:
            difficulty = int(assistant_message.strip())
        except ValueError:
            difficulty = 0


        # Update the issue difficulty in the issue_processing_collection
        issue_processing_collection.update_one({"_id": issue["_id"]}, {"$set": {"difficulty": difficulty}})

        # Add/update the user's issue with the new difficulty
        user_collection.update_one(
            {"issues.issueId": issue["issueId"]},
            {"$set": {"issues.$.difficulty": difficulty}}
        )

        # Delete the issue from IssueProcessing after it is processed
        issue_processing_collection.delete_one({"_id": issue["_id"]})

        return {"data": difficulty}

    except Exception as e:
        return {"error": str(e)}




@app.get("/processpullrequest")
async def process_pull_request(request : Request):
    # Find first pull request with difficulty "processing"
    pull_request = pull_request_processing_collection.find_one({"difficulty": "processing"})

    if not pull_request:
        return {"data": "No pull requests to process."}

    input_text = pull_request['body'] # Assuming the pull request body is stored in 'body' field

    input_text = truncate_text(input_text, 460)

    stream = llm(f"Question : can you rank the difficulty of this GitHub Pull Request from 1 to 10 : {input_text}. Output only an integer, nothing else'. Answer: ",
                 max_tokens = 10 ,
                 stop = ["\n", "Question :", "Q:"],
                 stream = True,)

    async def async_generator():
        for item in stream:
            yield item

    async def server_sent_events():
        async for item in async_generator():
            if await request.is_disconnected():
                break

            result = copy.deepcopy(item)
            text = result["choices"][0]["text"]

            # Update the pull request difficulty in the pull_request_processing_collection
            pull_request_processing_collection.update_one({"_id": pull_request["_id"]}, {"$set": {"difficulty": text}})

            # Add/update the user's pull request with the new difficulty
            user_collection.update_one(
                {"pullRequests.pullRequestId": pull_request["pullRequestId"]}, 
                {"$set": {"pullRequests.$.difficulty": text}}
            )

            # Delete the pull request from PullRequestProcessing after it is processed
            pull_request_processing_collection.delete_one({"_id": pull_request["_id"]})

            yield {"data": text}

    return EventSourceResponse(server_sent_events())






@app.get("/processpullrequestgpt")
async def process_pull_request(request: Request):

    # Find first pull request with difficulty "processing"
    pull_request = pull_request_processing_collection.find_one({"difficulty": "processing"})

    if not pull_request:
        return {"data": "No pull requests to process."}

    input_text = pull_request.get('body') or ""
    additions = pull_request.get('additions', 0)
    print(additions)
    deletions = pull_request.get('deletions', 0)
    print(deletions)
    changedFiles = pull_request.get('changedFiles', 0)
    print(changedFiles)
    total_changes = additions + deletions

    code = pull_request.get('code')  # Assuming 'code' field has the large code base
    summarized_code = await process_large_code(code)
    print('summarized code : ' , summarized_code)
# Then, add summarized_code to your main GPT prompt that evaluates the pull request difficulty.



    user_message = {
        "role": "user",
        "content": f"Rate the difficulty of this GitHub pull request with {additions} lines added, {deletions} lines deleted (total {total_changes} changes): '{input_text}'. And this a summarized code version from the diff files : '{summarized_code} .                Remember, your rating should be from 1 to 10. Answer : " 
    }

    try:
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior developer who specializes in evaluating GitHub pull requests based on their complexity. Your task is to assess the difficulty of the pull requests on a scale of 1 to 10, where 1 indicates a very easy pull request and 10 indicates a very complex pull request. If the pull request is not understandable, you should give it a rating of 0. Please note that you should only provide a numerical integer score."
                },
                user_message
            ]
        )
        assistant_message = completion['choices'][0]['message']['content']
        try:
            # Try to extract numeric value from the assistant_message
            match = re.search(r'\b\d+\b', assistant_message)
            if match:
                difficulty = int(match.group())
            else:
                raise ValueError("No numeric value found in GPT-3.5's response")
        except ValueError as e:
            return {"error": f"Difficulty extraction failed: {str(e)}", "gpt_response": assistant_message}

        # Update the pull request difficulty in the pull_request_processing_collection
        pull_request_processing_collection.update_one({"_id": pull_request["_id"]}, {"$set": {"difficulty": difficulty}})

        # Add/update the user's pull request with the new difficulty
        user_collection.update_one(
            {"pullRequests.pullRequestId": pull_request["pullRequestId"]},
            {"$set": {"pullRequests.$.difficulty": difficulty}}
        )

        # Delete the pull request from PullRequestProcessing after it is processed
        pull_request_processing_collection.delete_one({"_id": pull_request["_id"]})

        return {"data": difficulty}

    except Exception as e:
        return {"error": str(e)}





@app.get("/processcomment")
async def process_comment(request : Request):
    # Find first comment with difficulty "processing"
    comment = comment_processing_collection.find_one({"score": "processing"})

    if not comment:
        return {"data": "No comments to process."}

    input_text = comment['body']

    input_text = truncate_text(input_text, 100)

    stream = llm(f"Question : can you rank the difficulty of this GitHub Comment from 1 to 10 : {input_text}. Output only an integer, nothing else'. Answer: ",
                    max_tokens = 10 ,
                    stop = ["\n", "Question :", "Q:"],
                    stream = True,)
    
    async def async_generator():
        for item in stream:
            yield item

    async def server_sent_events():
        async for item in async_generator():
            if await request.is_disconnected():
                break

            result = copy.deepcopy(item)
            text = result["choices"][0]["text"]

            # Update the comment difficulty in the comment_processing_collection
            comment_processing_collection.update_one({"_id": comment["_id"]}, {"$set": {"difficulty": text}})

            # Add/update the user's comment with the new difficulty
            user_collection.update_one(
                {"comments.commentId": comment["commentId"]}, 
                {"$set": {"comments.$.difficulty": text}}
            )

            # Delete the comment from CommentProcessing after it is processed
            comment_processing_collection.delete_one({"_id": comment["_id"]})

            yield {"data": text}

    return EventSourceResponse(server_sent_events())





openai.api_key = ""  # Your ChatGPT API Key



@app.get("/rateDifficulty")
async def rate_difficulty(input_text: str):
    # Truncate the pull request text if it's too long for GPT-3
    truncated_input_text = input_text[:2000]
    
    user_message = {
        "role": "user",
        "content": f"Rate the difficulty of this GitHub pull request: '{truncated_input_text}'. Remember, your rating should be a number from 1 to 10 because it will be passed to other functions that take only integers as inputs, (if the pull request is not understandable, just put 2, do not provide any textual explanation). Answer : "
    }

    try:
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior developer who specializes in evaluating GitHub pull requests / issues based on their complexity. Your task is to assess the difficulty of the pull requests / issues on a scale of 1 to 10, where 1 indicates a very easy pull request and 10 indicates a very complex pull request. If the pull request is not understandable, you should give it a rating of 2. Please note that you should only provide a numerical integer score."
                },
                user_message
            ]
        )
        assistant_message = completion['choices'][0]['message']['content']
        difficulty = int(assistant_message.strip())  # Extracting the difficulty

        return {"score": difficulty}

    except Exception as e:
        return {"error": str(e)}
    





@app.get("/ratecomment")
async def rate_comment(comment: str):
    # Truncate the comment if it's too long for GPT-3
    truncated_comment = comment[:2000]

    # First check if the comment is toxic
    toxic_message = {
        "role": "user",
        "content": f"Is the following GitHub comment toxic? Please reply with 'yes' or 'no' without any elaboration: '{truncated_comment}'"
    }

    try:
        toxic_check_completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You can evaluate comments for their toxicity. If you are given a comment, determine if it is toxic by simply replying 'yes' or 'no' without further explanation"
                },
                toxic_message
                ]
        )
        toxic_check_result = toxic_check_completion['choices'][0]['message']['content'].strip().lower()

        if "yes" in toxic_check_result:
            toxic_score_message = {
                "role": "user",
                "content": f"How toxic is this GitHub comment? Please provide a rating from -1 (least toxic) to -10 (most toxic). Respond only with the number. Comment: '{truncated_comment}'"
            }

            toxic_score_completion = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You can rate the level of toxicity in comments. When given a toxic comment, rate it on a scale of -1 to -10 where -1 is least toxic and -10 is most toxic. Only provide the number as the response."
                    },
                    toxic_score_message
                ]
            )
            toxic_score = int(toxic_score_completion['choices'][0]['message']['content'].strip())
            return {"score": toxic_score}
                # If the comment isn't toxic, evaluate its usefulness
        usefulness_message = {
            "role": "user",
            "content": f"Rate the usefulness of this GitHub comment on a scale of 1 to 10. If the comment is not understandable, rate it as 0. Do not provide any textual explanation. Comment: '{truncated_comment}'"
        }

        usefulness_completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior code reviewer who evaluates comments based on specific categories: G- (General negative), G+ (General positive), G0 (General neutral), GA (General advice), S- (Specific negative), S+ (Specific positive), S0 (Specific neutral), SA (Specific advice), PV (Personal voice), OT (Off-topic). Understand these categories and output a numerical score from 1 to 10 to indicate the comment's overall usefulness."
                },
                usefulness_message
            ]
        )
        usefulness_score = int(usefulness_completion['choices'][0]['message']['content'].strip())
        return {"score": usefulness_score}

    except Exception as e:
        return {"error": str(e)}
    






@app.get("/processcommentgpt")
async def process_comment(request: Request):

    # Find first comment with difficulty "processing"
    comment = comment_processing_collection.find_one({"score": "processing"})

    if not comment:
        return {"data": "No comments to process."}

    input_text = comment['body']
    truncate_text(input_text, 2000)

    user_message = {
        "role": "user",
        "content": f"Rate the usefulness of this GitHub comment: '{input_text}'. Remember, your rating should be a number from 1 to 10 because it will be passed to other functions that takes only integers as an input, (if the comment is not understandable, just put 0 , do not provide any textual explanation). Answer : "
    }

    try:
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages = [
                {
                    "role": "system",
                    "content": "You are a senior code reviewer who specializes in evaluating comments based on specific categories: G- (General negative), G+ (General positive), G0 (General neutral), GA (General advice), S- (Specific negative), S+ (Specific positive), S0 (Specific neutral), SA (Specific advice), PV (Personal voice), OT (Off-topic). You understand how each of these categories contributes to the overall usefulness of a GitHub comment. When you are given a GitHub comment, consider all these categories but output only a numerical integer score from 1 to 10 indicating its overall usefulness."
                },
                user_message
            ]
        )
        assistant_message = completion['choices'][0]['message']['content']
        difficulty = int(assistant_message.strip())  # Extracting the difficulty


        # Second GPT call - Classify the comment
        category_message = {
            "role": "user",
            "content": f"Classify this GitHub comment into one of the categories (G-, G+, G0, GA, S-, S+, S0, SA, PV, OT): '{input_text}'. Answer:"
        }
        
        completion_category = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages = [
                {
                    "role": "system",
                    "content": "You are a senior code reviewer who specializes in evaluating comments based on specific categories: G- (General negative), G+ (General positive), G0 (General neutral), GA (General advice), S- (Specific negative), S+ (Specific positive), S0 (Specific neutral), SA (Specific advice), PV (Personal voice), OT (Off-topic). Please classify the given comment into one of these categories."
                },
                category_message
            ]
        )
        category_assistant_message = completion_category['choices'][0]['message']['content']
        comment_category = category_assistant_message.strip()  # Extracting the category


        # Update the comment difficulty in the comment_processing_collection
        comment_processing_collection.update_one({"_id": comment["_id"]}, {"$set": {"score": difficulty, "category": comment_category}})


        # Add/update the user's comment with the new difficulty
        user_collection.update_one(
            {"comments.commentId": comment["commentId"]},
            {"$set": {"comments.$.score": difficulty , "comments.$.category": comment_category}}
        )



        # Fetch the user and the related issue by the commentId
        user_data = user_collection.find_one({"comments.commentId": comment["commentId"]})
        if not user_data:
            return {"error": "User not found with provided comment ID"}

        # Retrieve the current value of 'pointsMade' for the related issue
        current_issue_points = next((issue["pointsMade"] for issue in user_data["issues"] if issue["issueId"] == comment["relatedIssuePRId"]), 0)

        # Calculate the new cumulative points for the issue
        cumulative_issue_points = int(current_issue_points) + int(difficulty)

        # Update the 'pointsMade' of the specific issue related to the comment
        user_collection.update_one(
            {"_id": user_data["_id"]},
            {"$set": {"issues.$[elem].pointsMade": cumulative_issue_points}},
            array_filters=[{"elem.issueId": comment["relatedIssuePRId"]}]
        )


        # Fetch the current user's totalPoints
        user_data = user_collection.find_one({"comments.commentId": comment["commentId"]})
        current_total_points = user_data.get('totalPoints', 0)
        current_total_coins = user_data.get('coins', 0)

        # Update the user's totalPoints with the new score
        updated_total_points = current_total_points + difficulty
        updated_total_coins = current_total_coins + difficulty*2
        user_collection.update_one(
            {"comments.commentId": comment["commentId"]},
            {
                "$set": {
                    "totalPoints": updated_total_points,
                    "coins": updated_total_coins
                }
            }
        )



        # Check for achievements after updating points
        API_base = "your_gamification_server_api_base_url_here"
        response = httpx.post(f"{API_base}/user/checkAchievement", json={"senderName": user_data["name"]})
        achievement_data = response.json()

        if achievement_data.get("success"):
            print("Achievement check successful.")
        else:
            print("Error checking achievement:", achievement_data.get("message"))






        # Delete the comment from CommentProcessing after it is processed
        comment_processing_collection.delete_one({"_id": comment["_id"]})

        return {"data": difficulty, "category": comment_category}

    except Exception as e:
        return {"error": str(e)}


