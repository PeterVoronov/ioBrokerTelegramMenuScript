//*** MenuTem Class - begin ***//
class MenuItem {
    type = '';
    id = '';
    holder;
    name = '';
    isButton;
    #index;
    #text;
    run;
    nested = new Array();

    static headerHierarchyChar = '↳';

    /**
     * Constructor function for the class
     * @param {object} attributes - The MenuItem attributes = {exec, button}.
     * @param {string} name - The MenuITem name.
     * @param {string=} id - The MenuITem id.
     * @param {string=} type - The MenuITem type.
     * @param {string=} text - The MenuITem text.
     * @param {MenuItem=} holder - The MenuItem which holds this MenuItem.
     */
    constructor(attributes, name, id, type, text, holder) {
      this.name = name;
      this.id = id ? id : '';
      this.type = type ? type : '';
      this.#text = text;
      Object.keys(attributes).forEach(attribute => {
        this[attribute] = attributes[attribute];
      });
      if (holder) holder.push(this);
    }

    set index(index) {
      this.#index = index;
    }

    get index() {
      let index = [];
      if (this.holder) index = this.holder.index;
      if (this.id) {
        index.push(this.id);
      } else if (this.#index !== undefined) {
        index.push(this.#index);
      }
      return index;
    }

    get indexNumeric() {
      let index = [];
      if (this.holder) index = this.holder.index;
      if (this.#index !== undefined) index.push(this.#index);
      return index;
    }

    push(nested) {
      if (nested) {
        nested.removeFromHolder();
        nested.index = this.nested.length;
        nested.holder = this;
        this.nested.push(nested);
        if (!this.isButton) this.isButton = true;
      }
    }

    remove(nested) {
      if (this.nested && nested) {
        if (nested.index !== undefined && nested.index >= 0 && nested.index <= this.nested.length) {
          this.nested.splice(nested.index, 1);
          nested.index = undefined;
          nested.holder = undefined;
        }
      }
    }

    removeFromHolder() {
      if (this.holder) {
        this.holder.remove(this);
      }
    }

    findNestedIndexById(id) {
      return this.nested.findIndex(nested => nested.id === id);
    }

    get mask() {
      let id = '';
      if (this.holder) {
        id = this.holder.mask;
        // console.log(`${this.name},  id = ${id}, this.id = ${this.id}`)
        if (id && this.id) {
          id = [id, this.id].join(this.type === this.holder.type ? ':' : '.');
        } else if (this.id) {
          id = this.id;
        }
      }
      return id;
    }

    get text() {
      let text = this.#text === undefined ? '' : this.#text;
      if (this.nested) this.nested.forEach(nested => {
        text += `\n${nested.text}`;
      });
      return text;
    }

    getHeader(hierarchical) {
      let header = '';
      if (this.holder) {
        header = this.holder.getHeader(hierarchical);
        if (hierarchical) {
          const holderLastLineArray = header.split('\n'),
            holderLastLine = holderLastLineArray && holderLastLineArray.length > 1 ? holderLastLineArray.pop() : '',
            holderIdent = holderLastLine ? holderLastLine.split(MenuItem.headerHierarchyChar).shift() : '';
          header += `\n${holderIdent}${''.padEnd(hierarchical)}${MenuItem.headerHierarchyChar}${this.name}`;
        } else {
          header += ' > ' + this.name;
        }
      } else {
        header += this.name;
      }
      return header;
    }

    get button() {
      let text = '';
      if (this.isButton) {
        text = `\n[text = ${this.text}, id = ${this.mask}, index = ${this.index.join('.')}]`;
      }
      return text;
    }

    draw() {
      let text = `\n${this.getHeader(2)}:\n${this.text}`;
      if (this.nested) {
        text += `\nid = ${this.mask}\n`;
        this.nested.forEach(nested => {
          text += nested.button;
        });
      }
      console.log(text);
    }

    go(address) {
      // console.log(`address = ${address}, ${JSON.stringify(this)}`)
      if (Array.isArray(address)) {
        if (address.length) {
          const addressOld = [...address];
          let index = address.shift();
          if (this.nested && this.nested.length) {
            if (isNaN(index)) {
              index = this.findNestedIndexById;
            } else {
              index = Number(index);
            }
            if (index >= 0 && index < this.nested.length) {
              const nested = this.nested[index];
              if (nested.run !== undefined) {
                nested.run();
                this.draw();
              } else if (nested.isButton) {
                address = nested.go(address);
              } else {
                address = addressOld;
                this.draw();
              }
            } else {
              address = addressOld;
              this.draw();
            }
          } else {
            address = addressOld;
            this.draw();
          }
        } else {
          if (this.run !== undefined) {
            this.run();
          } else {
            this.draw();
          }
        }
      }
      return address && address.length ? address : undefined;
    }

    toJSON() {
      const object = {};
      Object.entries(this).forEach(([key, value]) => {
        switch (key) {
          case 'holder':
            if (value) {
              object[key] = {id: value.id, type: value.type, name: value.name};
            } else {
              object[key] = undefined;
            }
            break;

            case 'nested':
              if (value && Array.isArray(value)) {
                object[key] = value.map(item => item.toJSON());
              } else {
                object[key] = undefined;
              }
              break;

  /*           case 'function':
            case 'destination': {
              if (value) {
                object[key] = value.toJSON();
              }
            }
   */
          default:
            if (value instanceof MenuItem) {
              object[key] = {id: value.id, type: value.type, name: value.name};
            } else {
              object[key] = value;
            }
            break;
        }
      });
      return {[this.constructor.name]: object};
    }

  }
  //*** MenuTem Class - end ***//


  const functionsId = '0_userdata.0.telegram_automenu.1.functions',
    destinationsId = '0_userdata.0.telegram_automenu.1.destinations',
    reportsId = '0_userdata.0.telegram_automenu.1.simpleReports';


  /* const main = new MenuItem({}, 'Main', '', 'top', 'main');
  main.push(new MenuItem({isButton: true}, 'Item 1', 'one', 'function', 'item 1'));
  main.push(new MenuItem({isButton: true}, 'Item 2', 'two', 'function', 'item 2'));
  const item3 = new MenuItem({isButton: true}, 'Item 3', 'three', 'function', 'item 3', main);
  // main.push(item3);
  main.push(new MenuItem({isButton: false}, 'Item 4', 'four', 'function', 'item 4'));
  item3.push(new MenuItem({isButton: true}, 'SubItem 1', 'five', 'function', 'subItem 1'));
  const subItem2 = new MenuItem({isButton: false}, 'SubItem 2', 'six', 'function', 'subItem 2', item3)
  // item3.push(subItem2);
  item3.push(new MenuItem({isButton: false}, 'SubItem 3', 'three', 'destination', 'subItem 3'));
  item3.push(new MenuItem({isButton: true}, 'SubItem 4', 'four', 'destination', 'subItem 4'));
  console.log('Main');
  main.draw();
  let address = [1, 2];
  console.log(`address = ${address}`);
  console.log(`result = ${JSON.stringify(main.go(address))}`);
  address = [2, 1];
  console.log(`address = ${address}`);
  console.log(`result = ${JSON.stringify(main.go(address))}`);
  subItem2.push(new MenuItem({isButton: true}, 'SubSubItem 1', 'one', 'destination', 'subSubItem 1'));
  subItem2.push(new MenuItem({isButton: false}, 'SubSubItem 2', 'one', 'destination', 'subSubItem 2'));
  const subSubItem3 = new MenuItem({isButton: true}, 'SubSubItem 3', 'two', 'destination', 'subSubItem 3', subItem2);
  address = [2, 1];
  console.log(`address = ${address}`);
  console.log(`result = ${JSON.stringify(main.go(address))}`);
  address = [2, 1, 2];
  console.log(`address = ${address}`);
  console.log(`result = ${JSON.stringify(main.go(address))}`);
  subSubItem3.push(new MenuItem({isButton: false}, 'SubSubSubItem 1', 'five', 'destination', 'subSubSubItem 1'));
  address = [2, 1, 2, 0];
  console.log(`address = ${address}`);
  console.log(`result = ${JSON.stringify(main.go(address))}`);
  console.log(` = ${subSubItem3 instanceof MenuItem}`)
   */
  const enumerationsList = {};
  const functionsList = JSON.parse(getState(functionsId).val),
    destinationsList = JSON.parse(getState(destinationsId).val),
    reportsList = JSON.parse(getState(reportsId).val);
  enumerationsList.funcs = functionsList;
  enumerationsList.dests = destinationsList;
  enumerationsList.reps = reportsList;

  // log(JSON.stringify(enumerationsList));

  class MenuItemEnumerations extends MenuItem {
    details = {};

    constructor(attributes, name, id, type, text, holder) {
      super({isButton: true}, name, id, type, text, holder);
      Object.keys(attributes).forEach(attribute => {
        this.details[attribute] = attributes[attribute];
      });
    }

  }


  class MenuItemFunction extends MenuItemEnumerations {


    constructor(attributes, name, id, text, holder) {
      super(attributes, name, id, 'function', text, holder);
       if (holder) {
        if (holder.type === this.type) {
          if (holder.holder && holder.holder.type !== 'root') {
            this.destination = holder.holder;
          }
        } else {
          if (holder.type !== 'root') {
            this.destination = this.holder;
          }
        }
      }
    }

  }

  class MenuItemDestination extends MenuItemEnumerations {


    constructor(attributes, name, id, text, holder) {
      super(attributes, name, id, 'destination', text, holder);
      if (holder) {
        if (holder.type === this.type) {
          if (holder.holder && holder.holder.type !== 'root') {
            this.function = holder.holder;
          }
        } else {
          if (holder.type !== 'root') {
            this.function = this.holder;
          }
        }
      }
    }

  }

  class MenuItemRoot extends MenuItem {

    topLevelType = '';

    constructor(attributes, name, id, topLevelType) {
      super({isButton: true}, name, id, 'root');
      this.topLevelType = topLevelType;
      Object.keys(attributes).forEach(attribute => {
        this[attribute] = attributes[attribute];
      });
      const prefixEnums = 'enum';
      const primaryList = enumerationsList[topLevelType].list,
        primaryFilter = (itemId) => (primaryList[itemId].isEnabled),
        primarySort = (a, b) => (primaryList[a].order - primaryList[b].order),
        primaryIds = Object.keys(primaryList).filter(primaryFilter).sort(primarySort),
        secondaryType = topLevelType === 'funcs' ? 'dests' : 'funcs',
        secondaryList = enumerationsList[secondaryType].list,
        secondaryFilter = (itemId) => (secondaryList[itemId].isEnabled),
        secondarySort = (a, b) => (secondaryList[a].order - secondaryList[b].order),
        secondaryIds = Object.keys(secondaryList).filter(secondaryFilter).sort(secondarySort);
      primaryIds.forEach(primaryId => {
        const primaryItem = primaryList[primaryId];
          // console.log(`state[id=*${primaryItem.state}](${primaryItem.enum}=${primaryId})`)
        if (!primaryItem.isExternal) {
          $(`state[id=*${/* primaryItem.state ? primaryItem.state :  */''}](${primaryItem.enum}=${primaryId})`).each((stateId) => {
            // console.log(`stateId = ${stateId}`);
            if (existsObject(stateId)) {
              const stateObject = getObject(stateId, '*');
              secondaryIds.forEach(secondaryId => {
                const secondaryItem = secondaryList[secondaryId],
                  secondaryFullId = [prefixEnums, secondaryItem.enum, secondaryId].join('.');
                  // console.log(`stateId = ${stateId}, itemId = ${secondaryId}`);
                if (stateObject.hasOwnProperty('enumIds')) {
                  let putTo;
                  if (stateObject['enumIds'].includes(secondaryFullId)) {
                    const sectionsCount = topLevelType === 'funcs' ? primaryItem.statesSectionsCount : secondaryItem.statesSectionsCount,
                      primaryStateId =  topLevelType === 'funcs' ? primaryItem.state : secondaryItem.state,
                      shortStateId = stateId.split('.').slice(-sectionsCount).join('.');
                    if (primaryStateId === shortStateId) {
                      // console.log(`shortStateId = ${shortStateId}, itemId = ${secondaryId}`);
                      putTo = this;
                      let id, index, item;
                      if (primaryId.includes('.')) {
                        id = primaryId.split('.').shift();
                        if (id) {
                          index = putTo.findNestedIndexById(id);
                          if (index >= 0) {
                            putTo = putTo.nested[index];
                          } else {
                            item = primaryList[primaryId];
                            if (topLevelType === 'funcs') {
                              putTo = new MenuItemFunction(item, id, id, id, putTo);
                            } else {
                              putTo = new MenuItemDestination(item, id, id, id, putTo);
                            }
                          }
                        }
                      }
                      id = primaryId.split('.').pop();
                      if (id) {
                        index = putTo.findNestedIndexById(id);
                        if (index >= 0) {
                          putTo = putTo.nested[index];
                        } else {
                          item = primaryList[primaryId];
                          if (topLevelType === 'funcs') {
                            putTo = new MenuItemFunction(item, id, id, id, putTo);
                          } else {
                            putTo = new MenuItemDestination(item, id, id, id, putTo);
                          }
                        }
                      }
                      if (secondaryId.includes('.')) {
                        id = secondaryId.split('.').shift();
                        if (id) {
                          index = putTo.findNestedIndexById(id);
                          if (index >= 0) {
                            putTo = putTo.nested[index];
                          } else {
                            item = secondaryList[secondaryId];
                            if (topLevelType === 'funcs') {
                              putTo = new MenuItemDestination(item, id, id, id, putTo);
                            } else {
                              putTo = new MenuItemFunction(item, id, id, id, putTo);
                            }
                          }
                        }
                      }
                      id = secondaryId.split('.').pop();
                      if (id) {
                        index = putTo.findNestedIndexById(id);
                        if (index >= 0) {
                          putTo = putTo.nested[index];
                        } else {
                          item = secondaryList[secondaryId];
                          if (topLevelType === 'funcs') {
                            putTo = new MenuItemDestination(item, id, id, id, putTo);
                          } else {
                            putTo = new MenuItemFunction(item, id, id, id, putTo);
                          }
                        }
                      }
                      const _device = new MenuItem({isButton: true}, shortStateId, shortStateId, 'device', shortStateId, putTo);
                    }
                  }
                }
              });
            }
          });
        }
      });
    }

  }



  // const testF = new MenuItemFunction({}, 'testF');
  // const testD = new MenuItemDestination({}, 'testD');

  // console.log(JSON.stringify(testF));
  // console.log(JSON.stringify(testD));

  // testF.init({topLevelType: 'funcs'});
  // console.log(JSON.stringify(testF));

  // testD.init({topLevelType: 'dests'});
  // console.log(JSON.stringify(testD));
  console.log('--------------------------------');
  let root = new MenuItemRoot({}, 'rootMenu', '', 'dests');
  console.log('--------------------------------');
  root = new MenuItemRoot({}, 'rootMenu', '', 'funcs');
  console.log('--------------------------------');
  // root.init({topLevelType: 'funcs'});
  console.log(`root = ${JSON.stringify(root, null, 1)}`);

  const _address = ['network', 'vpn', 'family', 'oldcat'];
  // console.log(`address = ${address}`);
  // console.log(`result = ${JSON.stringify(root.go(address))}`);