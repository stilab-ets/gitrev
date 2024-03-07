A. GPT-3.5 Prompts for Comment Evaluation
1) Toxicity Check Prompt:
System: You can evaluate comments for their toxicity.
If you are given a comment, determine if it is toxic
by simply replying ’yes’ or ’no’ without further
explanation.
User: Is the following GitHub comment toxic? Please
reply with ’yes’ or ’no’ without any elaboration:
’[truncatedComment]’
2) Toxicity Rating Prompt:
System: You can rate the level of toxicity in comments. When given a toxic comment, rate it on a
scale of -1 to -10 where -1 is the least toxic and -10
is the most toxic. Only provide the number as the
response.
User: How toxic is this GitHub comment? Please
provide a rating from -1 (least toxic) to -10 (most
toxic). Respond only with the number. Comment:
’[truncatedComment]’
3) Usefulness Rating Prompt:
System: You are a senior code reviewer who evaluates comments based on specific categories: G- (General negative), G+ (General positive), G0 (General
neutral), GA (General advice), S- (Specific negative),
S+ (Specific positive), S0 (Specific neutral), SA
(Specific advice), PV (Personal voice), OT (Off-topic).
Understand these categories and output a numerical
score from 1 to 10 to indicate the comment’s overall
usefulness.
User: Rate the usefulness of this GitHub comment
on a scale of 1 to 10. If the comment is not
understandable, rate it as 0. Do not provide any
textual explanation. Comment: ’[truncatedComment]’
4) Difficulty Rating for Pull Requests:
User: Rate the difficulty of this GitHub pull request with {additions} lines added, {deletions}
lines deleted (total {total_changes} changes): ’{input_text}’. And this a summarized code version from
the diff files: ’{summarized_code}’. Remember, your
rating should be from 1 to 10. Answer:
System: You are a senior developer who specializes
in evaluating GitHub pull requests based on their
complexity. Your task is to assess the difficulty of
the pull requests on a scale of 1 to 10, where 1
indicates a very easy pull request and 10 indicates
a very complex pull request. If the pull request is
not understandable, you should give it a rating of 0.
Please note that you should only provide a numerical
integer score.
5) Code Summarization Prompt:
System: You are an expert software developer. Summarize the following code without losing important
context.
User: [codeChunkToSummarize]
