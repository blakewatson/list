import { loadObject, saveObject } from './storage.js';

/* Items */

export const getItems = () => {
  return loadObject('list-items');
};

export const setItems = (items) => {
  saveObject('list-items', items);
};

/* API Helpers */

export const sendRequests = async (requests) => {
  try {
    const token = localStorage.getItem('list-app-token');

    if (!token) {
      return { errors: ['Missing token.'] };
    }

    const resp = await fetch('api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'App-Token': token
      },
      body: JSON.stringify({ requests })
    });

    return await resp.json();
  } catch (err) {
    console.error(err);
    return false;
  }
};

/* Request Queue */

let queue = [];

// local storage of queue
const getQueue = () => {
  return loadObject('list-queue');
};

const setQueue = (queue) => {
  saveObject('list-queue', queue);
};

export const RequestType = {
  getItems: 'getItems',
  addItem: 'addItem',
  editItem: 'editItem',
  removeItem: 'removeItem',
  removeAll: 'removeAll',
  uncheckAll: 'uncheckAll'
};

export const queueRequest = (requestType, payload = null) => {
  queue.push({
    requestType,
    payload
  });

  setQueue(queue);
};

// kick off processing of requests
export const initQueue = () => {
  queue = getQueue() || [];
};

export const processQueue = async () => {
  if (!queue.length) {
    return;
  }

  try {
    const requests = [...queue];

    const resp = await sendRequests(requests);

    if (resp.data) {
      const updateEvent = new CustomEvent('update-items', {
        detail: resp.data
      });
      window.dispatchEvent(updateEvent);
    }
  } catch (err) {
    console.error(err);
  }
};
