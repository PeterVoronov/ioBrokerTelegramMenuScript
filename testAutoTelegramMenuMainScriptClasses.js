/* eslint-disable no-unused-vars */
const dataTypeDestination = 'destination',
  dataTypeFunction = 'function',
  dataTypeReport = 'report';
const prefixEnums = 'enum';
let goCount = 7;

//*** MenuTem Class - begin ***//
class MenuItem {
  type = '';
  id = '';
  holder;
  #name = '';
  isButton;
  #index;
  #text;
  toRun;
  nested = new Array();
  details = {};

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
    this.#name = name;
    this.id = id ? id : '';
    this.type = type ? type : '';
    this.#text = text;
    this.applyAttributes(attributes);
    if (holder) holder.push(this);
  }

  applyAttributes(attributes) {
    Object.keys(this).forEach((attribute) => {
      if (attributes[attribute] !== undefined) {
        this[attribute] = attributes[attribute];
      }
    });
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
    return this.nested.findIndex((nested) => nested.id === id);
  }

  get mask() {
    let id = '';
    if (this.holder) {
      id = this.holder.mask;
      // console.log(`${this.name},  id = ${id}, this.id = ${this.id}`)
      if (id && this.id) {
        id = [id, this.id].join(this.type === this.holder.type ? '.' : ':');
      } else if (this.id) {
        id = this.id;
      }
    }
    return id;
  }

  get text() {
    let text = this.#text === undefined ? '' : this.#text;
    if (this.nested)
      this.nested.forEach((nested) => {
        if (!nested.isButton) {
          text += `\n${nested.text}`;
        }
      });
    return text;
  }

  get name() {
    return [this.details.icon ? this.details.icon : '', this.#name].join('');
  }

  set name(name) {
    this.#name = name;
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
      text = `\n[text = ${this.text}, id = ${this.mask}, type = ${this.type}, index = ${this.index.join('.')}]`;
    }
    return text;
  }

  draw() {
    let text = `\n${this.getHeader(2)}:\n${this.text}`;
    if (this.nested) {
      text += `\nid = ${this.mask}\n`;
      this.nested.forEach((nested) => {
        text += nested.button;
      });
    }
    console.log(text);
  }

  run(address, value) {
    if (this.toRun) {
      return this.toRun(this, value, () => this.go(address, value, true));
    } else {
      return this.go(address, value, true);
    }
  }

  go(address, value, noRun = false) {
    // log(`${this.id}: ${this.isButton}, go address = ${address}, noRun = ${noRun}`);
    if (!noRun) {
      address = this.run(address, value);
    } else {
      if (this.isButton) {
        let workAddress;
        if (Array.isArray(address) && address.length) {
          workAddress = [...address];
          if (address.length === 1 && address[0] < 0) {
            address = [0]; // to make it changed and avoid the draw method call
          } else {
            if (this.nested && this.nested.length) {
              let index = workAddress.shift();
              if (isNaN(index)) {
                index = this.findNestedIndexById(index);
              } else {
                index = Number(index);
              }
              if (index >= 0 && index < this.nested.length) {
                const nested = this.nested[index];
                const go = nested.go(workAddress, value);
                if (go !== undefined && go.length === 1 && go[0] < 0) {
                  go[0]++;
                  if (go[0] === 0) {
                    workAddress = address;
                  } else {
                    workAddress = go;
                  }
                } else {
                  workAddress = go;
                }
              } else {
                workAddress = address;
              }
            }
          }
        }
        const isAddressUnchanged = JSON.stringify(address) === JSON.stringify(workAddress);
        if ((Array.isArray(address) && address.length === 0) || isAddressUnchanged) {
          this.draw();
        } else if (!isAddressUnchanged) {
          address = workAddress;
        }
      } else {
        address = [-1];
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
            object[key] = value.map((item) => item.toJSON());
          } else {
            object[key] = undefined;
          }
          break;

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

class MenuItemRoot extends MenuItem {
  topLevelType = '';
  deviceClass = MenuItemDevice;

  constructor(attributes, name, id, topLevelType) {
    super({isButton: true}, name, id, 'root');
    this.topLevelType = topLevelType;
    this.applyAttributes(attributes);
  }

  #pushTo(holder, itemId, item, itemList, itemClass) {
    let index, id;
    if (itemId.includes('.') || item.holder) {
      id = item.holder ? item.holder : itemId.split('.').shift();
      holder = this.#pushTo(holder, id, {}, itemList, itemClass);
    }
    id = itemId.split('.').pop();
    if (id) {
      index = holder.findNestedIndexById(id);
      if (index >= 0) {
        holder = holder.nested[index];
      } else {
        item = itemList[itemId];
        holder = new itemClass(item, id, id, id, holder);
      }
    }
    return holder;
  }

  run(address, value) {
    this.nested = new Array();
    const primaryList = enumerationsList[this.topLevelType].list,
      primaryFilter = (itemId) => primaryList[itemId].isEnabled,
      primarySort = (a, b) => primaryList[a].order - primaryList[b].order,
      primaryIds = Object.keys(primaryList).filter(primaryFilter).sort(primarySort),
      secondaryType = this.topLevelType === dataTypeFunction ? dataTypeDestination : dataTypeFunction,
      secondaryList = enumerationsList[secondaryType].list,
      primaryItemClass = this.topLevelType === dataTypeFunction ? MenuItemFunction : MenuItemDestination,
      secondaryFilter = (itemId) => secondaryList[itemId].isEnabled,
      secondarySort = (a, b) => secondaryList[a].order - secondaryList[b].order,
      secondaryIds = Object.keys(secondaryList).filter(secondaryFilter).sort(secondarySort),
      secondaryItemClass = this.topLevelType === dataTypeFunction ? MenuItemDestination : MenuItemFunction;
    primaryIds.forEach((primaryId) => {
      const primaryItem = primaryList[primaryId];
      if (!primaryItem.isExternal) {
        $(`state(${primaryItem.enum}=${primaryId})`).each((stateId) => {
          if (existsObject(stateId)) {
            const stateObject = getObject(stateId, '*');
            secondaryIds
              .filter((itemId) => !secondaryList[itemId].isExternal)
              .forEach((secondaryId) => {
                const secondaryItem = secondaryList[secondaryId],
                  secondaryFullId = [prefixEnums, secondaryItem.enum, secondaryId].join('.'),
                  workingItem = this.topLevelType === dataTypeFunction ? primaryItem : secondaryItem;
                if (stateObject.hasOwnProperty('enumIds')) {
                  let pushTo;
                  if (stateObject['enumIds'].includes(secondaryFullId)) {
                    const sectionsCount = workingItem.statesSectionsCount,
                      primaryStateId = workingItem.state,
                      shortStateId = stateId.split('.').slice(-sectionsCount).join('.');
                    if (primaryStateId === shortStateId) {
                      pushTo = this.#pushTo(this, primaryId, primaryItem, primaryList, primaryItemClass);
                      pushTo = this.#pushTo(pushTo, secondaryId, secondaryItem, secondaryList, secondaryItemClass);
                      const deviceId = stateId
                          .split('.')
                          .slice(-1 - sectionsCount, -sectionsCount)
                          .pop(),
                        objectId = stateId.split('.').slice(0, -sectionsCount).join('.');
                      if (deviceId !== undefined)
                        new this.deviceClass({objectId, primaryStateId}, deviceId, deviceId, pushTo);
                    }
                  }
                }
              });
          }
        });
      } else {
        this.#pushTo(this, primaryId, primaryItem, primaryList, primaryItemClass);
      }
    });
    secondaryIds
      .filter((itemId) => secondaryList[itemId].isExternal)
      .forEach((secondaryId) => {
        const secondaryItem = secondaryList[secondaryId];
        this.#pushTo(this, secondaryId, secondaryItem, secondaryList, secondaryItemClass);
      });
    return super.run(address, value);
  }
}

const functionsId = '0_userdata.0.telegram_automenu.1.functions',
  destinationsId = '0_userdata.0.telegram_automenu.1.destinations',
  reportsId = '0_userdata.0.telegram_automenu.1.simpleReports';

const enumerationsList = {};
const functionsList = JSON.parse(getState(functionsId).val),
  destinationsList = JSON.parse(getState(destinationsId).val),
  reportsList = JSON.parse(getState(reportsId).val);
enumerationsList[dataTypeFunction] = functionsList;
enumerationsList[dataTypeDestination] = destinationsList;
enumerationsList[dataTypeReport] = reportsList;

// log(JSON.stringify(enumerationsList));

class MenuItemEnumerations extends MenuItem {
  constructor(attributes, name, id, type, text, holder) {
    super({isButton: true}, name, id, type, text, holder);
    this.details = attributes;
  }
}

class MenuItemFunction extends MenuItemEnumerations {
  constructor(attributes, name, id, text, holder) {
    super(attributes, name, id, dataTypeFunction, text, holder);
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
    super(attributes, name, id, dataTypeDestination, text, holder);
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

class MenuItemDevice extends MenuItem {
  objectId = '';
  primaryStateId = '';

  constructor(attributes, name, id, holder) {
    super({isButton: true}, name, id, 'device', undefined, holder);
    this.applyAttributes(attributes);
  }

  run(address, value) {
    let currentFunction, _currentDestination;
    if (this.holder.function) {
      currentFunction = this.holder.function;
      _currentDestination = this.holder;
    } else {
      _currentDestination = this.holder.destination;
      currentFunction = this.holder;
    }
    if (currentFunction.details) {
      const primaryId = this.primaryStateId;
      if (currentFunction.details.deviceAttributes) {
        const deviceAttributes = currentFunction.details.deviceAttributes,
          filter = (item) => deviceAttributes[item].isEnabled,
          sort = (a, b) => deviceAttributes[a].order - deviceAttributes[b].order,
          deviceAttributesList = Object.keys(deviceAttributes).filter(filter).sort(sort);
        deviceAttributesList.forEach((attribute) => {
          const fullId = [this.objectId, attribute].join('.');
          if (existsObject(fullId)) {
            const id = primaryId === attribute ? 'primary' : attribute;
            new MenuItemDeviceAttribute({}, id, fullId, this);
          }
        });
      }
      if (currentFunction.details.deviceButtons) {
        const deviceButtons = currentFunction.details.deviceButtons,
          filter = (item) => deviceButtons[item].isEnabled,
          sort = (a, b) => deviceButtons[a].order - deviceButtons[b].order,
          deviceButtonsList = Object.keys(deviceButtons).filter(filter).sort(sort);
        deviceButtonsList.forEach((button) => {
          const fullId = [this.objectId, button].join('.');
          if (existsObject(fullId)) {
            new MenuItemDeviceButton({}, button, fullId, this);
          }
        });
      }
    }
    return super.run(address, value);
  }
}

class valueBase {
  id;
  owner;
  #value;
  #type;
  #subtype;
  #step;
  #min;
  #max;
  #states;

  constructor() {
    this.id = '';
  }

  setOwner(owner) {
    if (owner !== undefined && owner !== null) {
      if (owner instanceof MenuItemWithValue) {
        this.owner = owner;
        this.id = owner.id;
        this.#configure();
        return true;
      }
    }
    return false;
  }

  #configure() {
    if (this.owner.details) {
      const details = this.owner.details;
      if (details.states) {
        this.#type = 'enumerable';
        this.#states = new Map();
        if (details.type) this.#subtype = details.type;
        const states = details.states;
        let statesArray;
        if (typeof states === 'string') {
          statesArray = states.indexOf(';') > 0 ? states.split(';') : states.indexOf(',') > 0 ? states.split(',') : [];
        } else if (Array.isArray(states)) {
          statesArray = states;
        } else if (typeof states === 'object') {
          statesArray = Object.entries(states);
        }
        if (statesArray && statesArray.length) {
          statesArray.forEach((stateItem) => {
            let value, name;
            if (Array.isArray(stateItem)) {
              [value, name] = stateItem;
            } else if (typeof stateItem === 'string') {
              if (stateItem.includes(':')) {
                [value, name] = stateItem.split(':');
                if (this.#subtype === 'number') {
                  // @ts-ignore
                  if (!isNaN(value)) {
                    value = Number(value);
                  } else {
                    value = undefined;
                  }
                }
              } else {
                value = stateItem.trim();
                name = stateItem;
              }
            }
            if (value !== undefined && name !== undefined) {
              this.#states.set(value, name.trim());
            }
          });
        }
      } else if (details.type) {
        this.#type = details.type;
      }
      if (details.min !== undefined) this.#min = details.min;
      if (details.max !== undefined) this.#max = details.max;
      if (details.step !== undefined) this.#step = details.step;
    }
  }

  loadValue() {
    return undefined;
  }

  getValue() {
    if (this.#value === undefined) {
      this.#value = this.loadValue();
    }
    return this.#value;
  }

  get possibleValues() {
    let values = new Map();
    if (!this.#type) {
      this.#configure();
    }
    if (this.#type === 'boolean') {
      values.set(true, 'true');
      values.set(false, 'false');
    } else if (this.#type === 'enumerable') {
      values = this.#states;
    } else if (this.#type === 'number' && this.#min !== undefined && this.#max !== undefined) {
      const step = this.#step || 1;
      for (let value = this.#min; value <= this.#max; value += step) {
        values.set(value, `${value}`);
      }
    }
    return values;
  }

  saveValue(value) {
    return true;
  }

  checkValue(value) {
    let result = true,
      error;
    if (this.#type === 'number' || this.#subtype === 'number') {
      if (isNaN(value)) {
        error = {id: 'TypeError'};
        result = false;
      } else {
        value = Number(value);
      }
    }
    if (result) {
      if (this.#type === 'boolean') {
        value = !this.#value;
      } else {
        const possibleValues = this.possibleValues;
        if (!possibleValues.has(value)) {
          if (possibleValues.size) {
            error = {id: 'OutOfRange'};
          } else if (this.#type === 'number') {
            if (
              (this.#min !== undefined && value > this.#min) ||
              (this.#max !== undefined && value < this.#max) ||
              (this.#step !== undefined && value % this.#step !== 0)
            ) {
              result = false;
              error = {id: 'OutOfRange'};
            }
          }
        }
      }
    }
    return {result, value, error};
  }

  setValue(value) {
    let result = true,
      error = null;
    if (value !== undefined) {
      if (this.#value === undefined) this.getValue();
      if (this.#value !== value) {
        ({result, value, error} = this.checkValue(value));
        // log(`setValue: result = ${result}, value = ${value}, error = ${JSON.stringify(error)}`)
        if (result) {
          if (this.saveValue(value)) {
            this.#value = value;
            // log(`setValue: #value = ${this.#value}`)
          } else {
            result = false;
            error = {id: 'SetStateError'};
          }
        }
      }
    } else {
      error = {id: 'EmptyValue'};
    }
    return {result, error};
  }

  run(address, value) {
    // log(`${this.owner.type}, ${this.#type}, ${JSON.stringify(address)}, ${value}, ${this.constructor.name}, ${JSON.stringify(this)}`);
    if (this.owner && this.owner.isButton) {
      if (this.#value === undefined || this.#value === null) this.getValue();
      if (this.#type === 'boolean') {
        this.setValue(!this.#value);
        address = [-1];
      } else if (this.#type === 'enumerable') {
        if (value === undefined || value === null) {
          this.#states.forEach((name, value) => {
            const button = new MenuItemValueButton({}, name, value, value === this.#value, this.owner);
            button.assignValue(this);
          });
        } else {
          this.setValue(value);
          address = [-2];
        }
      }
    } else {
      address = [-1];
    }
    return address;
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
            object[key] = value.map((item) => item.toJSON());
          } else {
            object[key] = undefined;
          }
          break;

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

class valueState extends valueBase {
  fullId = '';

  setOwner(owner) {
    if (super.setOwner(owner)) {
      if (owner instanceof MenuItemDeviceState) {
        this.fullId = owner.fullId;
        return true;
      }
    }
    return false;
  }

  loadValue() {
    if (existsState(this.fullId)) {
      const value = getState(this.fullId);
      if (value && value.val !== undefined) {
        return value.val;
      }
    } else {
      return undefined;
    }
  }

  saveValue(value) {
    if (existsState(this.fullId) || existsObject(this.fullId)) {
      setState(this.fullId, value);
      return true;
    }
    return false;
  }
}

class MenuItemWithValue extends MenuItem {
  value;

  constructor(attributes, name, id, type, holder) {
    super(attributes, name, id, type, undefined, holder);
  }

  assignValue(value) {
    if (value !== undefined && value !== null && value instanceof valueBase) {
      this.value = value;
      if (!value.owner) {
        this.value.setOwner(this);
      }
    }
  }

  get text() {
    if (this.value !== undefined && this.value !== null) {
      return [this.name, this.value.getValue()].join(': ');
    } else {
      return this.id;
    }
  }

  run(address, value) {
    // log(`run: ${JSON.stringify(this.value)}`);
    if (this.value) address = this.value.run(address, value);
    return super.run(address, value);
  }
}

class MenuItemValueButton extends MenuItemWithValue {
  #value;
  #current;

  constructor(attributes, name, value, current, holder) {
    super({isButton: 'true', type: 'button', ...attributes}, name, '', 'valueButton', holder);
    this.#value = value;
    this.#current = current;
    this.id = `${value}`.replaceAll('.', '');
  }

  run(address, value) {
    // log(`run: ${JSON.stringify(this.value)}`);
    if (this.value) address = this.value.run(address, this.#value);
    return super.run(address, value);
  }
}

class MenuItemDeviceState extends MenuItemWithValue {
  fullId = '';

  constructor(attributes, id, fullId, holder) {
    super({isButton: false, ...attributes}, '', id, 'state', holder);
    this.applyAttributes(attributes);
    this.fullId = fullId;
    if (this.fullId && existsObject(this.fullId)) {
      const object = getObject(this.fullId);
      if (object.common) this.details = object.common;
      if (object.common.name) {
        this.name = object.common.name;
      }
    }
    this.assignValue(new valueState());
  }
}
class MenuItemDeviceAttribute extends MenuItemDeviceState {
  constructor(attributes, id, fullId, holder) {
    super({isButton: false, type: 'attribute', ...attributes}, id, fullId, holder);
    this.applyAttributes(attributes);
  }
}

class MenuItemDeviceButton extends MenuItemDeviceState {
  constructor(attributes, id, fullId, holder) {
    super({isButton: 'true', type: 'button', ...attributes}, id, fullId, holder);
    this.applyAttributes(attributes);
  }
}

let /* root = new MenuItemRoot({}, 'rootMenu', '', dataTypeDestination); */
  // const address = ['family', 'oldcat', 'network', 'vpn', 'OldCatMi11t'];
  root = new MenuItemRoot(
    {
      /* deviceClass: MenuItemDeviceNoButton */
    },
    'rootMenu',
    '',
    dataTypeFunction,
  );
// const address = ['network', 'vpn', 'family', 'oldcat', 'OldCatNew', 'enabled' /* */];

const address = ['plug', 'office', 'heater', 'power_outage_memory' /*, 'restore'  */];

log(`address = ${address}`);
log(`result = ${JSON.stringify(root.go(address))}`);
// log(`root = ${JSON.stringify(root, null, 1)}`);
