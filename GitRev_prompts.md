# GPT-3.5 Prompts for Comment Evaluation

### Toxicity Check Prompt:
**System:** You can evaluate comments for their toxicity. Determine if the following comment is toxic by replying 'yes' or 'no':
> "Please reply with 'yes' or 'no': '[truncatedComment]'"

### Toxicity Rating Prompt:
**System:** Rate the level of toxicity in the comment on a scale of -1 (least toxic) to -10 (most toxic). Only provide the numerical rating as the response:
> "How toxic is this GitHub comment? Comment: '[truncatedComment]'"

### Usefulness Rating Prompt:
**System:** As a senior code reviewer, evaluate comments based on specific categories and rate the overall usefulness on a scale of 1 to 10:
> "Rate the usefulness of this GitHub comment. Comment: '[truncatedComment]'"

### Difficulty Rating for Pull Requests:
**System:** As a senior developer, assess the difficulty of GitHub pull requests on a scale from 1 (very easy) to 10 (very complex):
> "Rate the difficulty of this GitHub pull request with {additions} lines added, {deletions} lines deleted: '{input_text}'."

### Code Summarization Prompt:
**System:** Summarize the following code snippet as an expert software developer:
> "[codeChunkToSummarize]"
