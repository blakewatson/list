import { loadObject, saveObject } from './storage.js';

/* Items */

export const getItems = () => {
  return loadObject('list-items');
};

export const setItems = (items) => {
  saveObject('list-items', items);
};

/* API Helpers */

export const sendRequests = async (requests, abortSignal = null) => {
  const token = localStorage.getItem('list-app-token');

  if (!token) {
    return { errors: ['Missing token.'] };
  }

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'App-Token': token
    },
    body: JSON.stringify({ requests })
  };

  if (abortSignal) {
    options.signal = abortSignal;
  }

  const resp = await fetch('api.php', options);

  console.log('sendRequests resp', resp);

  return await resp.json();
};

/* Request Queue */

export const RequestType = {
  getItems: 'getItems',
  addItem: 'addItem',
  editItem: 'editItem',
  removeItem: 'removeItem',
  removeAll: 'removeAll',
  uncheckAll: 'uncheckAll'
};

class RequestQueue {
  constructor() {
    this.queue = this.getQueue();
    this.currentRequest = null; // Promise | null
  }

  getQueue() {
    return loadObject('list-queue') || [];
  }

  initPolling() {
    if (this.queue.length) {
      this.sendQueue();
    }

    // send any outstanding requests every five seconds
    setInterval(() => {
      this.request(RequestType.getItems);
    }, 5000);
  }

  async sendQueue() {
    if (!this.queue.length || this.currentRequest) {
      return;
    }

    // grab existing requests and empty the queue
    const requests = [...this.queue];
    this.queue = [];

    // attempt to send the requests for ten seconds
    const abort = new AbortController();
    setTimeout(() => abort.abort(), 8000);

    console.log('sending queued requests', requests);
    this.currentRequest = sendRequests(requests, abort.signal);

    try {
      const resp = await this.currentRequest;
      this.setQueue(); // save queue to localStorage

      console.log('response received', resp);

      if (resp.data) {
        console.log('response has data', resp.data);
        const updateEvent = new CustomEvent('update-items', {
          detail: resp.data
        });
        window.dispatchEvent(updateEvent);
      }

      this.currentRequest = null;

      // if they are more requests, send them now
      if (this.queue.length) {
        this.sendQueue();
      }
    } catch (err) {
      console.error(err);

      this.currentRequest = null;

      // if an abort error, put requests back in the queue
      if (err.name === 'AbortError') {
        console.log('request aborted. putting requests back in the queue');
        this.queue = [...requests, ...this.queue];
        console.log(this.queue);
        this.setQueue();
        this.sendQueue();
      }
    }
  }

  request(requestType, payload = null) {
    this.queue.push({
      requestType,
      payload
    });

    console.log('added to queue', requestType, payload);

    this.setQueue(); // save queue to localStorage
    this.sendQueue(); // send requests to the server
  }

  setQueue() {
    saveObject('list-queue', this.queue);
  }
}

export const queue = new RequestQueue();
