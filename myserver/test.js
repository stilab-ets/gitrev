const token = 'yourgithub token to test it here';

fetch('https://api.github.com/user', {
  headers: {
    Authorization: `Bearer ${token}`
  }
}).then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));