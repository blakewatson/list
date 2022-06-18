const queue = [];

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
};

// kick off processing of requests
export const initQueue = () => {};

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
    }
  } catch (err) {
    // put items back into queue
    queue = [...requests, ...queue];
  }
};
