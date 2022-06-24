import { queue as q, RequestType, sendRequests, setItems } from './data.js';
import { assignRandomId } from './idHelpers.js';

const { createApp } = Vue;

export const eventBus = createApp();

const app = createApp({
  data: () => ({
    // structure of item is {name: 'foo', done: false}
    items: [],
    text: '',
    editingItemId: null, // id string
    isAuthenticated: false,
    hasToken: false,
    password: ''
  }),

  watch: {
    hasToken(val) {
      if (val) {
        this.$nextTick(() => {
          this.$refs['addFormInput'].focus();
          this.$refs['addFormInput'].scrollIntoView({ block: 'center' });
        });

        this.getItemsFromServer();
      }
    }
  },

  methods: {
    addItem() {
      if (!this.text) {
        return;
      }

      const item = assignRandomId(
        {
          name: this.text,
          done: false
        },
        this.items
      );

      this.text = '';
      this.focusAddForm();

      this.items.push(item);
      q.request(RequestType.addItem, item);
      setItems(this.items);
    },

    checkItem(item, event) {
      item.done = event.target.checked;
      q.request(RequestType.editItem, item);
      setItems(this.items);
    },

    async getItemsFromServer() {
      try {
        const resp = await sendRequests([
          {
            requestType: RequestType.getItems
          }
        ]);

        if (!resp.errors.length && resp.data) {
          this.isAuthenticated = true;
          this.items = resp.data;
          setItems(this.items);
        }
      } catch (err) {
        console.error(err);
      }
    },

    editItem(editedItem) {
      this.items = this.items.map((item) => {
        if (item.id === editedItem.id) {
          return editedItem;
        }

        return item;
      });

      this.editingItemId = null;
      q.request(RequestType.editItem, editedItem);
      setItems(this.items);
    },

    focusAddForm() {
      this.$refs['addFormInput'].focus();
      this.$refs['addFormInput'].scrollIntoView({ block: 'center' });
    },

    handlePasswordSubmit() {
      if (!this.password) {
        return;
      }

      localStorage.setItem('list-app-token', this.password);
      this.hasToken = true;
    },

    itemsUpdateListener() {
      window.addEventListener('update-items', (event) => {
        this.items = event.detail;
        setItems(this.items);
      });
    },

    removeAllItems() {
      const yes = confirm('Are you sure you want to remove all items?');

      if (yes) {
        this.items = [];
        q.request(RequestType.removeAll);
        setItems([]);
      }
    },

    removeItem(id) {
      this.items = this.items.filter((item) => item.id !== id);
      q.request(RequestType.removeItem, id);
      setItems(this.items);
    },

    showEditForm(id) {
      this.editingItemId = id;
    },

    uncheckAll() {
      const yes = confirm('Are you sure you want to uncheck all items?');

      if (yes) {
        this.items.forEach((item) => (item.done = false));
        q.request(RequestType.uncheckAll);
        setItems(this.items);
      }
    }
  },

  created() {
    const token = localStorage.getItem('list-app-token');

    if (!token) {
      return;
    }

    this.hasToken = true;
  }
});

app.component('app-edit-form', {
  template: '#edit-form',

  props: ['item'],

  data: () => ({
    text: ''
  }),

  methods: {
    editItem() {
      if (!this.text) {
        return;
      }

      this.$emit('edited', {
        ...this.item,
        name: this.text
      });
    }
  },

  mounted() {
    this.text = this.item.name;
    this.$refs['textInput'].focus();
  }
});

app.mount('#app');

// register service worker
if (!window.location.origin.includes('localhost')) {
  if ('serviceWorker' in navigator) {
    console.log('Registering service worker...');
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) =>
        console.log('Server worker registered.', registration)
      )
      .catch((reason) => console.error(reason));
  }
}
