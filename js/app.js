import { getItems, setItems } from './data.js';
import { assignRandomId } from './idHelpers.js';

const { createApp } = Vue;

const app = createApp({
  data: () => ({
    // structure of item is {name: 'foo', done: false}
    items: [
      // { name: 'Milk', done: false },
      // { name: 'Eggs', done: false },
      // { name: 'Some kind of longer item name that is gonna wrap', done: false }
    ],
    editingItemId: null, // id string
    text: ''
  }),

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
      this.$refs['addFormInput'].focus();
      this.$refs['addFormInput'].scrollIntoView({ block: 'center' });

      this.items.push(item);
      //queueRequest(RequestType.addItems, [item]);
      setItems(this.items);
    },

    checkItem(item, event) {
      item.done = event.target.checked;
      //queueRequest(RequestType.editItems, [item]);
      setItems(this.items);
    },

    editItem(editedItem) {
      this.items = this.items.map((item) => {
        if (item.id === editedItem.id) {
          return editedItem;
        }

        return item;
      });

      this.editingItemId = null;
      //queueRequest(RequestType.editItems, [editedItem]);
      setItems(this.items);
    },

    removeAllItems() {
      const yes = confirm('Are you sure you want to remove all items?');

      if (yes) {
        const ids = this.items.map((item) => item.id);
        this.items = [];
        //queueRequest(RequestType.removeItems, ids)
        setItems([]);
      }
    },

    removeItem(id) {
      this.items = this.items.filter((item) => item.id !== id);
      //queueRequest(RequestType.removeItems, [id])
      setItems(this.items);
    },

    showEditForm(id) {
      this.editingItemId = id;
    },

    uncheckAll() {
      const yes = confirm('Are you sure you want to uncheck all items?');

      if (yes) {
        this.items.forEach((item) => (item.done = false));
        //queueRequest(RequestType.editItems, [this.items])
        setItems(this.items);
      }
    }
  },

  created() {
    //initQueue();
    this.items = getItems() || [];
  },

  mounted() {
    this.$refs['addFormInput'].focus();
    this.$refs['addFormInput'].scrollIntoView({ block: 'center' });
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
