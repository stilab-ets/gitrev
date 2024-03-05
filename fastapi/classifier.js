const axios = require('axios');

//http://3.81.48.50

const processComment = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/processcommentgpt');
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};

const processIssue = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/processissuegpt');
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};

const processPullRequest = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/processpullrequestgpt');
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};

const processQueue = async () => {
  while (true) {
    try {
      // Call your API endpoints here
      await processComment();
      await processIssue();
      await processPullRequest();

      // Sleep for 10 seconds before the next iteration
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(error);
      // Sleep for 10 seconds before the next iteration even if there was an error
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// Call the processQueue function
processQueue();
