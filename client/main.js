var csInterface = new CSInterface();
loadUniversalJSXLibraries();
loadJSX(csInterface.hostEnvironment.appName + '/host.jsx');
window.Event = new Vue();

Vue.component('namelow', {
  template: `
    <div class="appGrid" @mouseover="wakeApp" @mouseout="sleepApp">
      <mod-keys></mod-keys>
    </div>
  `,
  data() {
    return {
      showFoot: false,
    }
  },
  methods: {
    wakeApp(evt) {
      console.log('Waking up')
      this.$root.wake();
    },
    sleepApp(evt) {
      console.log('Sleeping')
      this.$root.sleep();
      Event.$emit('clearMods');
    }
  }
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
      this.Ctrl = this.$root.Ctrl;
      this.Shift = this.$root.Shift;
      this.Alt = this.$root.Alt;
      this.activeMods();
    },
    getModKeyClass(type) {
      return 'modKey-' + type.name + '-Active'
    },
    onMouseOutside(e, el) {
      // console.log(e)
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
    panelHeight: 200,
    persistent: true,
    // storage: window.localStorage,
    activeApp: csInterface.hostEnvironment.appName,
    activeTheme: 'darkest',
    isWake: false,
    Shift: false,
    Ctrl: false,
    Alt: false,
    context: {
      menu: [
        { id: "refresh", label: "Refresh panel", enabled: true, checkable: false, checked: false, },
        { id: "persistent", label: "Persistent Y/N", enabled: true, checkable: true, checked: true, },

      ],
    },
  },
  computed: {
    menuString: function () { return JSON.stringify(this.context); },
    isDefault: function () {
      var result = true;
      if ((this.Shift) | (this.Ctrl) | (this.Alt))
        result = false;
      return result;
    },
    CtrlShift: function () {
      if ((this.Ctrl) && (this.Shift)) {
        return true;
      } else {
        return false;
      }
    },
    CtrlAlt: function () {
      if ((this.Ctrl) && (this.Alt)) {
        return true;
      } else {
        return false;
      }
    },
    ShiftAlt: function () {
      if ((this.Shift) && (this.Alt)) {
        return true;
      } else {
        return false;
      }
    },
    CtrlShiftAlt: function () {
      if ((this.Ctrl) && (this.Shift) && (this.Alt)) {
        return true;
      } else {
        return false;
      }
    },
    CtrlOnly: function () {
      if ((this.Ctrl) && (!this.Shift) && (!this.Alt))
        return true;
      else
        return false;
    },
    ShiftOnly: function () {
      if ((!this.Ctrl) && (this.Shift) && (!this.Alt))
        return true;
      else
        return false;
    },
    AltOnly: function () {
      if ((!this.Ctrl) && (!this.Shift) && (this.Alt))
        return true;
      else
        return false;
    },
  },
  mounted: function () {
    var self = this;
    if (navigator.platform.indexOf('Win') > -1) { this.macOS = false; } else if (navigator.platform.indexOf('Mac') > -1) { this.macOS = true; }
    // this.startStorage();
    this.readStorage();
    this.setContextMenu();
    this.handleResize(null);
    window.addEventListener('resize', this.handleResize);
    Event.$on('modsUpdate', self.parseModifiers);
    Event.$on('updateStorage', self.updateStorage);
    csInterface.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, self.appThemeChanged);
    this.appThemeChanged();
  },
  methods: {
    contextMenuClicked(id) {
      var target = this.findMenuItemById(id);
      if (id == "refresh")
        location.reload();
      this.updateStorage();
    },
    startStorage() {
      storage.setItem('contextmenu', JSON.stringify(this.context.menu));
      storage.setItem('persistent', JSON.stringify(false));
      storage.setItem('theme', 'darkest');
    },
    readStorage() {
      var storage = window.localStorage;
      if (!storage.length) {
        console.log('There is no pre-existing session data');
        storage.setItem('contextmenu', JSON.stringify(this.context.menu));
        storage.setItem('persistent', JSON.stringify(false));
        storage.setItem('theme', self.activeTheme);
        // storage.setItem('appName', self.activeApp);
      } else {
        console.log('There is pre-existing session data');
        this.context.menu = JSON.parse(storage.getItem('contextmenu'));
        this.persistent = JSON.parse(storage.getItem('persistent'));
        this.activeTheme = storage.getItem('theme');
        // this.activeApp = storage.getItem('appName');
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
    setContextMenu() {
      var self = this;
      // console.log('setting context menu');
      csInterface.setContextMenuByJSON(self.menuString, self.contextMenuClicked);
      csInterface.updateContextMenuItem('persistent', true, self.persistent);
      // this.handleConfig();
    },
    appThemeChanged(event) {
      var skinInfo = JSON.parse(window.__adobe_cep__.getHostEnvironment()).appSkinInfo;
      this.findTheme(skinInfo);
      console.log(`Theme changed to ${this.activeTheme}`);
      this.updateStorage();
    },
    findTheme(appSkin) {
      // AE uses smooth gradients. Isolate the others apps from it
      if ((this.$root.activeApp == 'ILST') || (this.$root.activeApp == 'PHXS')) {
        if (toHex(appSkin.panelBackgroundColor.color) == '#f0f0f0') {
          this.activeTheme = 'lightest';
          if (this.$root.activeApp == 'ILST') {
            this.setCSS('color-scroll', '#fbfbfb');
            this.setCSS('color-scroll-thumb', '#dcdcdc');
            this.setCSS('color-scroll-thumb-hover', '#a6a6a6');
          } else if (this.$root.activeApp == 'PHXS') {
            this.setCSS('color-scroll', '#e3e3e3');
            this.setCSS('color-scroll-thumb', '#bdbdbd');
            this.setCSS('color-scroll-thumb-hover', '#bdbdbd');
          }
        } else if (toHex(appSkin.panelBackgroundColor.color) == '#b8b8b8') {
          this.activeTheme = 'light';
          if (this.$root.activeApp == 'ILST') {
            this.setCSS('color-scroll', '#c4c4c4');
            this.setCSS('color-scroll-thumb', '#a8a8a8');
            this.setCSS('color-scroll-thumb-hover', '#7b7b7b');
          } else if (this.$root.activeApp == 'PHXS') {
            this.setCSS('color-scroll', '#ababab');
            this.setCSS('color-scroll-thumb', '#858585');
            this.setCSS('color-scroll-thumb-hover', '#858585');
          }
        } else if (toHex(appSkin.panelBackgroundColor.color) == '#535353') {
          this.activeTheme = 'dark';
          if (this.$root.activeApp == 'ILST') {
            this.setCSS('color-scroll', '#4b4b4b');
            this.setCSS('color-scroll-thumb', '#606060');
            this.setCSS('color-scroll-thumb-hover', '#747474');
          } else if (this.$root.activeApp == 'PHXS') {
            this.setCSS('color-scroll', '#4a4a4a');
            this.setCSS('color-scroll-thumb', '#696969');
            this.setCSS('color-scroll-thumb-hover', '#696969');
          }
        } else if (toHex(appSkin.panelBackgroundColor.color) == '#323232') {
          this.activeTheme = 'darkest';
          if (this.$root.activeApp == 'ILST') {
            this.setCSS('color-scroll', '#2a2a2a');
            this.setCSS('color-scroll-thumb', '#383838');
            this.setCSS('color-scroll-thumb-hover', '#525252');
          } else if (this.$root.activeApp == 'PHXS') {
            this.setCSS('color-scroll', '#292929');
            this.setCSS('color-scroll-thumb', '#474747');
            this.setCSS('color-scroll-thumb-hover', '#474747');
          }
        }
        this.setCSS('color-bg', toHex(appSkin.panelBackgroundColor.color));
        this.setCSS('color-ui-hover', this.$root.getCSS('color-scroll'));
        if (this.$root.activeApp == 'ILST') {
          this.setCSS('scroll-radius', '20px');
          this.setCSS('thumb-radius', '10px');
        } else {
          this.setCSS('scroll-radius', '1px');
          this.setCSS('thumb-width', '8px');
        }
      } else {
        console.log('This is an After Effects theme');
        this.activeTheme = 'afterFX';
        this.setCSS('color-bg', toHex(appSkin.panelBackgroundColor.color));
        this.setCSS('color-ui-hover', toHex(appSkin.panelBackgroundColor.color, -10));
        this.setCSS('color-scroll', toHex(appSkin.panelBackgroundColor.color, -20));
        this.setCSS('color-scroll-thumb', toHex(appSkin.panelBackgroundColor.color));
        this.setCSS('color-scroll-thumb-hover', toHex(appSkin.panelBackgroundColor.color, 10));
        this.setCSS('scroll-radius', '20px');
        this.setCSS('thumb-width', '10px');
      }
    },
    findMenuItemById(id) {
      var result;
      for (var i = 0; i < this.context.menu.length; i++) {
        for (let [key, value] of Object.entries(this.context.menu[i])) {
          if (key == "menu") {
            for (var v = 0; v < value.length; v++) {
              for (let [index, data] of Object.entries(value[v])) {
                if ((index == "id") && (data == id))
                  result = value[v];
              }
            }
          }
          if ((key == "id") && (value == id)) {
            result = this.context.menu[i];
          }
        }
      }
      return result;
    },
    handleResize(evt) {
      if (this.$root.activeApp == 'AEFT') {
        // console.log(`w: ${this.panelWidth}, h: ${this.panelHeight}`);
        this.panelHeight = document.documentElement.clientHeight;
        // this.setPanelCSS();
        console.log(evt);
      } else {
        this.panelWidth = document.documentElement.clientWidth;
        this.panelHeight = document.documentElement.clientHeight;
        this.setPanelCSS();
      }
    },
    flushModifiers() {
      this.Ctrl = false;
      this.Shift = false;
      this.Alt = false;
      Event.$emit('clearMods');
    },
    parseModifiers(evt) {
      // console.log(evt)
      var lastMods = [this.Ctrl, this.Shift, this.Alt]
      if (this.isWake) {
        if (((!this.macOS) && (evt.ctrlKey)) || ((this.macOS) && (evt.metaKey))) {
          this.Ctrl = true;
        } else {
          this.Ctrl = false;
        }
        if (evt.shiftKey)
          this.Shift = true;
        else
          this.Shift = false;
        if (evt.altKey) {
          evt.preventDefault();
          this.Alt = true;
        } else {
          this.Alt = false;
        };
        var thisMods = [this.Ctrl, this.Shift, this.Alt]
        if (!this.isEqualArray(lastMods, thisMods))
          console.log(`${thisMods} : ${lastMods}`)
        Event.$emit('updateModsUI');
      } else {
        Event.$emit('clearMods');
      }
    },
    flushModifiers() {
      this.Ctrl = false;
      this.Shift = false;
      this.Alt = false;
      Event.$emit('clearMods');
    },
    wake() {
      this.isWake = true;
    },
    sleep() {
      this.isWake = false;
      this.flushModifiers();
    },
    testCS(evt) {
      this.cs.evalScript(`alert('${evt}')`)
    },
    setPanelCSS() {
      this.setCSS('panel-height', `${this.panelHeight - 10}px`);
      // this.setCSS('panel-width', `${this.panelWidth}px`);
    },
    getCSS(prop) {
      return window.getComputedStyle(document.documentElement).getPropertyValue('--' + prop);
    },
    setCSS(prop, data) {
      document.documentElement.style.setProperty('--' + prop, data);
    },
    isEqualArray(array1, array2) {
      array1 = array1.join().split(','), array2 = array2.join().split(',');
      var errors = 0, result;
      for (var i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i])
          errors++;
      }
      if (errors > 0)
        result = false;
      else
        result = true;
      return result;
    },
    removeEmptyValues(keyList, mirror = []) {
      // console.log(keyList);
      for (var i = 0; i < keyList.length; i++) {
        var targ = keyList[i];
        if ((/\s/.test(targ)) || (targ.length < 6)) {
          // console.log('Empty');
        } else {
          mirror.push(targ);
        }
      }
      return mirror;
    },
    removeDuplicatesInArray(keyList) {
      try {
        var uniq = keyList
          .map((name) => {
            return { count: 1, name: name }
          })
          .reduce((a, b) => {
            a[b.name] = (a[b.name] || 0) + b.count
            return a
          }, {})
        var sorted = Object.keys(uniq).sort((a, b) => uniq[a] < uniq[b])
      } catch (err) {
        sorted = keyList
      } finally {
        return sorted;
      }
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
