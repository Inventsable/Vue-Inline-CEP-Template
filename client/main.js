var csInterface = new CSInterface();
loadUniversalJSXLibraries();
loadJSX('host.jsx');
window.Event = new Vue();


Vue.component('set', {
  template : `
  <div class="set">
    <span> {{msg}} </span>
    <span class="swap-icon-fill"></span>
  </div>
  `,
  data() {
    return {
      msg: 'hi',
    }
  },
})

Vue.component('mod-keys', {
  template: `
    <div 
      v-mousemove-outside="onMouseOutside"
      v-keydown-outside="onKeyDownOutside"
      v-keyup-outside="onKeyUpOutside"
      class="visualizerModKeys" 
      :style="'grid-template-columns: repeat(' + this.activeList.length + ', 1fr);'">
      <div v-for="modKey in activeList" :class="getModKeyClass(modKey)"></div>
    </div>
  `,
  data() {
    return {
      activeList: [
        { name: 'Ctrl' },
        { name: 'Shift' },
        { name: 'Alt' },
      ],
      Shift: false,
      Ctrl: false,
      Alt: false,
    }
  },
  mounted() {
    var self = this;
    this.activeMods();
    Event.$on('updateModsUI', self.updateMods);
    Event.$on('clearMods', self.clearMods);
  },
  methods: {
    activeMods() {
      var mirror = [], child = {};
      if (this.Ctrl) {
        child = { name: 'Ctrl', key: 0 }
        mirror.push(child);
      }
      if (this.Shift) {
        child = { name: 'Shift', key: 1 }
        mirror.push(child);
      }
      if (this.Alt) {
        child = { name: 'Alt', key: 2 }
        mirror.push(child);
      }
      this.activeList = mirror;
    },
    clearMods() {
      this.Shift = false;
      this.Alt = false;
      this.Ctrl = false;
      this.activeList = [];
    },
    updateMods() {
      this.Ctrl = this.$root.mods.Ctrl;
      this.Shift = this.$root.mods.Shift;
      this.Alt = this.$root.mods.Alt;
      this.activeMods();
    },
    getModKeyClass(type) {
      return 'modKey-' + type.name + '-Active'
    },
    onMouseOutside(e, el) {
      this.$root.parseModifiers(e);
    },
    onKeyDownOutside(e, el) {
      // console.log(e)
      this.$root.parseModifiers(e);
    },
    onKeyUpOutside(e, el) {
      // console.log(e)
      this.$root.parseModifiers(e);
    },
  },
  computed: {
    isDefault: function () { return this.$root.isDefault },
  },
})


var app = new Vue({
  el: '#app',
  data: {
    macOS: false,
    panelWidth: 100,
    panelHeight: 100,
    mods: {
      Shift: false,
      Ctrl: false,
      Alt: false,
    },
    context: {
      menu: [
        { id: "refresh", label: "Refresh panel", enabled: true, checkable: false, checked: false, },
        { id: "persistent", label: "Persistent Y/N", enabled: true, checkable: true, checked: true, },

      ],
    },
  },
  computed: {
    menuString: function() {return JSON.stringify(this.context);},
    isDefault: function () {
      var result = true;
      if ((this.mods.Shift) | (this.mods.Ctrl) | (this.mods.Alt))
        result = false;
      return result;
    },
    CtrlShift: function () {
      if ((this.mods.Ctrl) && (this.mods.Shift)) {
        return true;
      } else {
        return false;
      }
    },
    CtrlAlt: function () {
      if ((this.mods.Ctrl) && (this.mods.Alt)) {
        return true;
      } else {
        return false;
      }
    },
    ShiftAlt: function () {
      if ((this.mods.Shift) && (this.mods.Alt)) {
        return true;
      } else {
        return false;
      }
    },
    CtrlShiftAlt: function () {
      if ((this.mods.Ctrl) && (this.mods.Shift) && (this.mods.Alt)) {
        return true;
      } else {
        return false;
      }
    },
    CtrlOnly: function () {
      if ((this.mods.Ctrl) && (!this.mods.Shift) && (!this.mods.Alt))
        return true;
      else
        return false;
    },
    ShiftOnly: function () {
      if ((!this.mods.Ctrl) && (this.mods.Shift) && (!this.mods.Alt))
        return true;
      else
        return false;
    },
    AltOnly: function () {
      if ((!this.mods.Ctrl) && (!this.mods.Shift) && (this.mods.Alt))
        return true;
      else
        return false;
    },
  },
  mounted: function () {
    var self = this;
    if (navigator.platform.indexOf('Win') > -1) { this.macOS = false; } else if (navigator.platform.indexOf('Mac') > -1) { this.macOS = true; }

    this.readStorage();
    this.setContextMenu();
    this.handleResize(null);
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy: function () {

  },
  methods: {
    contextMenuClicked(id) {
      if (id == "refresh")
        location.reload();
    },
    readStorage() {
      var storage = window.localStorage;
      if (!storage.length) {
        console.log('There is no pre-existing session data');
        storage.setItem('contextmenu', JSON.stringify(this.context.menu));
        storage.setItem('persistent', JSON.stringify(false));
        storage.setItem('theme', self.activeTheme);
        storage.setItem('appName', self.activeApp);
      } else {
        console.log('There is pre-existing session data');
        this.context.menu = JSON.parse(storage.getItem('contextmenu'));
        this.persistent = JSON.parse(storage.getItem('persistent'));
        this.activeTheme = storage.getItem('theme');
        this.appName = storage.getItem('appName');
      }
      console.log(storage);
    },
    updateStorage() {
      var storage = window.localStorage, self = this;
      storage.setItem('contextmenu', JSON.stringify(self.context.menu));
      storage.setItem('persistent', JSON.stringify(self.persistent));
      storage.setItem('theme', self.activeTheme);
      storage.setItem('appName', self.activeApp);
      console.log(`Updating local storage:
        Persistent: ${this.persistent}
        Theme: ${this.activeTheme}`)
    },
    handleResize(evt) {
      if (this.$root.activeApp == 'AEFT') {
        // console.log(`w: ${this.panelWidth}, h: ${this.panelHeight}`);
        this.panelHeight = document.documentElement.clientHeight;
        this.setCSSHeight();
        console.log(evt);
      } else {
        this.panelWidth = document.documentElement.clientWidth;
        this.panelHeight = document.documentElement.clientHeight;
        this.setCSSHeight();
      }
    },
    flushModifiers() {
      this.mods.Ctrl = false;
      this.mods.Shift = false;
      this.mods.Alt = false;
      Event.$emit('clearMods');
    },
    parseModifiers(evt) {
      var lastMods = [this.mods.Ctrl, this.mods.Shift, this.mods.Alt]
      if (this.isWake) {
        if (((!this.macOS) && (evt.ctrlKey)) || ((this.macOS) && (evt.metaKey))) {
          this.mods.Ctrl = true;
        } else {
          this.mods.Ctrl = false;
        }
        if (evt.shiftKey)
          this.mods.Shift = true;
        else
          this.mods.Shift = false;
        if (evt.altKey) {
          evt.preventDefault();
          this.mods.Alt = true;
        } else {
          this.mods.Alt = false;
        };
        var thisMods = [this.mods.Ctrl, this.mods.Shift, this.mods.Alt]
        if (!this.isEqualArray(lastMods, thisMods))
          Event.$emit('updateModsUI');
      } else {
        Event.$emit('clearMods');
      }
    },
    testCS(evt) {
      this.cs.evalScript(`alert('${evt}')`)
    },
    getCSS(prop) {
      return window.getComputedStyle(document.documentElement).getPropertyValue('--' + prop);
    },
    setCSS(prop, data) {
      document.documentElement.style.setProperty('--' + prop, data);
    },
  }
});

// Vue.component('test-btn', {
//   props: ['label'],
//   template: `
//     <div
//       class="btn"
//       @click="runTest(label)">
//       {{label}}
//     </div>
//   `,
//   methods: {
//     runTest: function(e) {
//       var targ = this.$root.compi, self = this;
//       try {
//         if (/run/.test(e))
//           csInterface.evalScript(`kickstart()`, self.recolor)
//         else if (/color/.test(e))
//           csInterface.evalScript(`colorcode()`, this.$root.getNames)
//         else if (/reset/.test(e))
//           csInterface.evalScript(`displayColorLabels()`)
//         else
//           csInterface.evalScript(`${e}()`)
//           // console.log('nothing happened');
//       } catch(err) {
//         console.log(err.data);
//       } finally {
//         console.log(`Ran ${e}`);
//       }
//     },
//     recolor: function(e) {
//       var targ = this.$root.compi;
//       csInterface.evalScript(`colorcode()`, this.$root.getNames)
//     }
//   }
// })

// Vue.component('test-toolbar', {
//   template: `
//     <div class="testToolbar">
//       <test-btn label="run"></test-btn>
//       <test-btn label="color"></test-btn>
//       <test-btn label="reset"></test-btn>
//     </div>
//   `,
// })
