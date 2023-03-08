/* eslint-disable no-unused-vars */
const dataTypeDestination = 'destination',
  dataTypeFunction = 'function',
  dataTypeReport = 'report';
const prefixEnums = 'enum';
// let goCount = 0;

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

  run(address) {
    if (this.toRun) {
      return this.toRun(this, () => this.go(address, true));
    } else {
      return this.go(address, true);
    }
  }

  go(address, noRun) {
    // log(`${this.id}: ${this.isButton}, go address = ${address}, noRun = ${noRun}`);
    if (!noRun) {
      address = this.run(address);
    } else {
      if (this.isButton) {
        let workAddress;
        if (Array.isArray(address) && address.length) {
          workAddress = [...address];
          if (this.nested && this.nested.length) {
            let index = workAddress.shift();
            if (isNaN(index)) {
              index = this.findNestedIndexById(index);
            } else {
              index = Number(index);
            }
            if (index >= 0 && index < this.nested.length) {
              const nested = this.nested[index];
              const go = nested.go(workAddress);
              if (go !== undefined && go.length === 1 && go[0] === -1) {
                workAddress = address;
              } else {
                workAddress = go;
              }
            } else {
              workAddress = address;
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

  run(address) {
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
    return this.go(address, true);
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

  run(address) {
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
    super.run(address);
    // return this.go(address, true);
  }
}

class MenuItemValue extends MenuItem {
  #value;
  owner;

  constructor(owner) {
    super({}, '', '', 'value', undefined, undefined);
    if (owner !== undefined && owner !== null) {
      if (owner instanceof MenuItemWithValue) {
        owner.assignValue(this);
      }
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

  saveValue(value) {}

  checkValue(value) {
    return {result: true, error: null};
  }

  setValue(value) {
    if (this.#value !== value) {
      const check = this.checkValue(value);
      if (check.result) {
        this.saveValue(value);
        this.#value = value;
      } else {
        return check;
      }
    } else {
      return {result: true, error: null};
    }
  }

  draw() {
    console.log(`${this.name}: ${this.#value}`);
  }
}

class MenuItemStateValue extends MenuItemValue {
  fullId = '';
  constructor(owner) {
    super(owner);
    if (owner instanceof MenuItemDeviceState) {
      this.fullId = owner.fullId;
    }
  }

  loadValue() {
    log(` > ${this.fullId}`);
    if (existsState(this.fullId)) {
      const value = getState(this.fullId);
      if (value && value.val !== undefined) {
        return value.val;
      }
    } else {
      return undefined;
    }
  }
}

class MenuItemWithValue extends MenuItem {
  value;

  constructor(attributes, name, id, type, holder) {
    super(attributes, name, id, type, undefined, holder);
  }

  assignValue(value) {
    if (value !== undefined && value !== null && value instanceof MenuItemValue) {
      if (value.id !== this.id) {
        if (value.owner !== undefined && value.owner !== null) {
          value.owner.freeValue();
        }
        this.value = value;
        value.owner = this;
        value.id = this.id;
      }
    }
  }

  freeValue() {
    if (this.value !== undefined && this.value !== null) {
      this.value.owner = undefined;
      this.value.id = '';
      this.value = undefined;
    }
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
    new MenuItemStateValue(this);
  }

  get text() {
    if (this.value !== undefined && this.value !== null) {
      return [this.name, this.value.getValue()].join(': ');
    } else {
      return this.id;
    }
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

class MenuItemValueEnumerable extends MenuItemValue {}

class MMenuItemValueBoolean extends MenuItemValueEnumerable {}

class MenuItemValueNumber extends MenuItemValue {}

let root = new MenuItemRoot({}, 'rootMenu', '', dataTypeDestination);
// const address = ['family', 'oldcat', 'network', 'vpn', 'OldCatMi11t'];
root = new MenuItemRoot(
  {
    /* deviceClass: MenuItemDeviceNoButton */
  },
  'rootMenu',
  '',
  dataTypeFunction,
);
const address = ['network', 'vpn', 'family', 'oldcat', 'OldCatNew' /*, 'enabled'  */];

log(`address = ${address}`);
log(`result = ${JSON.stringify(root.go(address))}`);
// log(`root = ${JSON.stringify(root, null, 1)}`);
