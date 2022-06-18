import { loadObject, saveObject } from './storage.js';

/* Items */

export const getItems = () => {
  return loadObject('list-items');
};

export const setItems = (items) => {
  saveObject('list-items', items);
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
  addItems: 'addItems',
  editItems: 'editItems',
  removeItems: 'removeItems',
  removeAll: 'removeAll',
  uncheckAll: 'uncheckAll'
};

export const queueRequest = (requestType, payload) => {
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

    const resp = await fetch('api.php', {
      method: 'POST',
      body: JSON.stringify({ requests })
    });

    const data = resp.json();

    if (!data.success) {
      // put items back into queue
      queue = [...requests, ...queue];
      setQueue(queue);
    }
  } catch (err) {
    // put items back into queue
    queue = [...requests, ...queue];
    setQueue(queue);
    throw new Error(err);
  }
};
