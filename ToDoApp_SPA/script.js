//OKTA widget
    const oktaSignIn = new OktaSignIn({
        baseUrl: "https://dev-97422735.okta.com",
        redirectUri: 'https://profuse-valiant-grass.glitch.me/',
        clientId: "0oa3pong2lvTNTI6o5d7",
        logo: "https://cdn.glitch.global/fdd6d429-5b86-4c1d-b69a-aaa59ed8948e/fs01jhp378tNyCGUQ1d8.png?v=1643446010876",
        authParams: {
          issuer: "https://dev-97422735.okta.com/oauth2/default",
          scopes: ['openid', 'profile']
        }
      });

      oktaSignIn.authClient.token.getUserInfo().then(function(user) {
        document.getElementById("greeting").innerHTML = "Welcome, " + user.preferred_username;
        document.getElementById("logout").style.display = 'block';
        document.getElementById("todos").style.display = 'block';
      }, function(error) {
        oktaSignIn.showSignInToGetTokens({
          el: '#okta-login-container'
        }).then(function(tokens) {
          oktaSignIn.authClient.tokenManager.setTokens(tokens);
          oktaSignIn.remove();
          const idToken = tokens.idToken;
          localStorage.setItem('username',idToken.claims.preferred_username);
          localStorage.setItem('accessToken',tokens.accessToken.accessToken);
          getToDosForUser(idToken.claims.preferred_username);
          document.getElementById("greeting").innerHTML = "Welcome, " + idToken.claims.preferred_username;
          document.getElementById("logout").style.display = 'block';
          document.getElementById("todos").style.display = 'block';


        }).catch(function(err) {
          console.error(err);
        });
      });

      function logout() {
        localStorage.removeItem('todoItems');
        localStorage.removeItem('idToken');
        localStorage.removeItem('username');
        oktaSignIn.authClient.signOut();
        location.reload();
      }

/********************************************************************************************************/
//To-DO list functionality

let todoItems = [];

function renderTodo(todo) {
  localStorage.setItem('todoItems', JSON.stringify(todoItems));

  const list = document.querySelector('.js-todo-list');
  const item = document.querySelector(`[data-key='${todo.id}']`);
  
  if (todo.deleted) {
    item.remove();
    if (todoItems.length === 0) list.innerHTML = '';
    return
  }

  const isChecked = todo.checked ? 'done': '';
  const node = document.createElement("li");
  node.setAttribute('class', `todo-item ${isChecked}`);
  node.setAttribute('data-key', todo.id);
  node.innerHTML = `
    <input id="${todo.id}" type="checkbox"/>
    <label for="${todo.id}" class="tick js-tick"></label>
    <span>${todo.text}</span>
    <button class="delete-todo js-delete-todo">
    <svg><use href="#delete-icon"></use></svg>
    </button>
  `;

  if (item) {
    list.replaceChild(node, item);
  } else {
    list.append(node);
  }
}

function addTodo(text) {
  const todo = {
    text,
    checked: false,
    id: ''+Date.now(),
  };
  addToDoForUser(localStorage.getItem('username'),todo);
  todoItems.push(todo);
  renderTodo(todo);
}

function toggleDone(key) {
  const index = todoItems.findIndex(item => item.id === key);
  todoItems[index].checked = !todoItems[index].checked;
  updateToDoForUser(localStorage.getItem('username'),todoItems[index])
  renderTodo(todoItems[index]);
}

function deleteTodo(key) {
  const index = todoItems.findIndex(item => item.id === key);
  const todo = {
    deleted: true,
    ...todoItems[index]
  };
  todoItems = todoItems.filter(item => item.id !== key);
  deleteToDoForUser(localStorage.getItem('username'),key);
  renderTodo(todo);
}

const form = document.querySelector('.js-form');
form.addEventListener('submit', event => {
  event.preventDefault();
  const input = document.querySelector('.js-todo-input');

  const text = input.value.trim();
  if (text !== '') {
    addTodo(text);
    input.value = '';
    input.focus();
  }
});

const list = document.querySelector('.js-todo-list');
list.addEventListener('click', event => {
  if (event.target.classList.contains('js-tick')) {
    const itemKey = event.target.parentElement.dataset.key;
    toggleDone(itemKey);
  }
  
  if (event.target.classList.contains('js-delete-todo')) {
    const itemKey = event.target.parentElement.dataset.key;
    deleteTodo(itemKey);
  }
});

document.addEventListener('DOMContentLoaded', () => loadList());

function loadList(){
  {
  const ref = localStorage.getItem('todoItems');
  if (ref) {
    todoItems = JSON.parse(ref);
    todoItems.forEach(t => {
      renderTodo(t);
    });
  }
}
}   


function getToDosForUser(user){
getCall('https://lumpy-deeply-flood.glitch.me/users/'+user+'/todos')
  .then(data => {
    //console.log(data); // JSON data parsed by `data.json()` call
    todoItems= data;
    localStorage.setItem('todoItems', JSON.stringify(todoItems));
    loadList();
    console.log(todoItems);
  });
}

function addToDoForUser(user,todo){
postCall('https://lumpy-deeply-flood.glitch.me/users/'+user+'/todos',todo);
}

function deleteToDoForUser(user,id){
deleteCall('https://lumpy-deeply-flood.glitch.me/users/'+user+'/todos/'+id);
}

function updateToDoForUser(user,todo){
putCall('https://lumpy-deeply-flood.glitch.me/users/'+user+'/todos',todo);
}

function wakeUpBackEnd(user,todo){
getCall('https://lumpy-deeply-flood.glitch.me/',todo);
}



// Example POST method implementation:
async function getCall(url = '') {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'GET', // *GET, POST, PUT, DELETE, etc.
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
      'Authorization':'Bearer '+localStorage.getItem('accessToken')
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

// Example POST method implementation:
async function postCall(url = '', data ={}) {
  console.log(data)
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization':'Bearer '+localStorage.getItem('accessToken')
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return;
}

async function putCall(url = '', data ={}) {
  console.log(data)
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'PUT', // *GET, POST, PUT, DELETE, etc.
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization':'Bearer '+localStorage.getItem('accessToken')
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return;
}

async function deleteCall(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
      'Authorization':'Bearer '+localStorage.getItem('accessToken')
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return; // parses JSON response into native JavaScript objects
}

