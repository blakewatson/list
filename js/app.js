const { createApp } = Vue;

const groceryItems = new Bin('groceryItems');

createApp({
  data: () => ({
    // structure of item is {name: 'foo', done: false}
    items: [
      { name: 'Milk', done: false },
      { name: 'Eggs', done: false },
      { name: 'Some kind of longer item name that is gonna wrap', done: false }
    ],
    text: ''
  }),

  methods: {
    addItem() {
      if (!this.text) {
        return;
      }

      this.items.push({
        name: this.text,
        done: false
      });

      this.text = '';
    }
  }
}).mount('#app');
