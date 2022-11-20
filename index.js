/**
 * Creates a new `Iterator` for looping over the `List`.
 *
 * @template {Item} [T=Item]
 */
class ItemIterator {
  /**
   * @param {T|null} item
   */
  constructor(item) {
    /** @type {T|null} */
    this.item = item
  }

  /**
   * Move the `Iterator` to the next item.
   *
   * @returns {IteratorResult<T, null>}
   */
  next() {
    const value = this.item

    if (value) {
      this.item = value.next
      return {value, done: false}
    }

    return {value: null, done: true}
  }
}

// Creates a new `Item`:
// An item is a bit like DOM node: It knows only about its “parent” (`list`),
// the item before it (`prev`), and the item after it (`next`).
export class Item {
  constructor() {
    /* eslint-disable no-unused-expressions */
    /** @type {List<this>|null} */
    this.list
    /** @type {this|null} */
    this.prev
    /** @type {this|null} */
    this.next
    /* eslint-enable no-unused-expressions */
  }

  /**
   * Prepends the given item *before* the item operated on.
   *
   * @param {this} item
   * @returns {this|false}
   */
  prepend(item) {
    const list = this.list

    if (!item || !item.append || !item.prepend || !item.detach) {
      throw new Error(
        'An argument without append, prepend, or detach methods was given to `Item#prepend`.'
      )
    }

    // If self is detached or prepending ourselves, return false.
    if (!list || this === item) {
      return false
    }

    // Detach the prependee.
    item.detach()

    // If self has a previous item...
    if (this.prev) {
      item.prev = this.prev
      this.prev.next = item
    }

    // Connect the prependee.
    item.next = this
    item.list = list

    // Set the previous item of self to the prependee.
    this.prev = item

    // If self is the first item in the parent list, link the lists first item to
    // the prependee.
    if (this === list.head) {
      list.head = item
    }

    // If the the parent list has no last item, link the lists last item to self.
    if (!list.tail) {
      list.tail = this
    }

    list.size++

    return item
  }

  /**
   * Appends the given item *after* the item operated on.
   *
   * @param {this} item
   * @returns {this|false}
   */
  append(item) {
    const list = this.list

    if (!item || !item.append || !item.prepend || !item.detach) {
      throw new Error(
        'An argument without append, prepend, or detach methods was given to `Item#append`.'
      )
    }

    // If self is detached or appending ourselves, return false.
    if (!list || this === item) {
      return false
    }

    // Detach the appendee.
    item.detach()

    // If self has a next item…
    if (this.next) {
      item.next = this.next
      this.next.prev = item
    }

    // Connect the appendee.
    item.prev = this
    item.list = list

    // Set the next item of self to the appendee.
    this.next = item

    // If the the parent list has no last item or if self is the parent lists last
    // item, link the lists last item to the appendee.
    if (this === list.tail || !list.tail) {
      list.tail = item
    }

    list.size++

    return item
  }

  /**
   * Detaches the item operated on from its parent list.
   *
   * @returns {this}
   */
  detach() {
    const list = this.list

    if (!list) {
      return this
    }

    // If self is the last item in the parent list, link the lists last item to
    // the previous item.
    if (list.tail === this) {
      list.tail = this.prev
    }

    // If self is the first item in the parent list, link the lists first item to
    // the next item.
    if (list.head === this) {
      list.head = this.next
    }

    // If both the last and first items in the parent list are the same, remove
    // the link to the last item.
    if (list.tail === list.head) {
      list.tail = null
    }

    // If a previous item exists, link its next item to selfs next item.
    if (this.prev) {
      this.prev.next = this.next
    }

    // If a next item exists, link its previous item to selfs previous item.
    if (this.next) {
      this.next.prev = this.prev
    }

    // Remove links from self to both the next and previous items, and to the
    // parent list.
    this.prev = null
    this.next = null
    this.list = null

    list.size--

    return this
  }
}

// type-coverage:ignore-next-line
Item.prototype.next = null
// type-coverage:ignore-next-line
Item.prototype.prev = null
// type-coverage:ignore-next-line
Item.prototype.list = null

/**
 * Creates a new List: A linked list is a bit like an Array, but knows nothing
 * about how many items are in it, and knows only about its first (`head`) and
 * last (`tail`) items.
 * Each item (e.g. `head`, `tail`, &c.) knows which item comes before or after
 * it (its more like the implementation of the DOM in JavaScript).
 *
 * @template {Item} [T=Item]
 * @implements {Iterable<T>}
 */
export class List {
  /**
   * Creates a new list from the arguments (each a list item) passed in.
   *
   * @template {Item} [T=Item]
   * @param {Array<T|null|undefined>} items
   * @returns {List<T>}
   */
  static of(...items) {
    /** @type {List<T>} */
    const list = new this()
    return appendAll(list, items)
  }

  /**
   * Creates a new list from the given array-like object (each a list item) passed
   * in.
   *
   * @template {Item} [T=Item]
   * @param {Array<T|null|undefined>} [items]
   */
  static from(items) {
    /** @type {List<T>} */
    const list = new this()
    return appendAll(list, items)
  }

  /**
   * Creates a new list from the given array-like object (each a list item) passed
   * in.
   *
   * @param {Array<T|null|undefined>} items
   */
  constructor(...items) {
    /* eslint-disable no-unused-expressions */
    /** @type {number} */
    this.size
    /** @type {T|null} */
    this.head
    /** @type {T|null} */
    this.tail
    /* eslint-enable no-unused-expressions */

    appendAll(this, items)
  }

  /**
   * Returns the list’s items as an array.
   *
   * This does *not* detach the items.
   */
  toArray() {
    let item = this.head
    /** @type {Array<T>} */
    const result = []

    while (item) {
      result.push(item)
      item = item.next
    }

    return result
  }

  /**
   * Prepends the given item to the list.
   *
   * `item` will be the new first item (`head`).
   *
   * @param {T|null|undefined} [item]
   * @returns {T|false}
   */
  prepend(item) {
    if (!item) {
      return false
    }

    if (!item.append || !item.prepend || !item.detach) {
      throw new Error(
        'An argument without append, prepend, or detach methods was given to `List#prepend`.'
      )
    }

    if (this.head) {
      return this.head.prepend(item)
    }

    item.detach()
    item.list = this
    this.head = item
    this.size++

    return item
  }

  /**
   * Appends the given item to the list.
   *
   * `item` will be the new last item (`tail`) if the list had a first item,
   * and its first item (`head`) otherwise.
   *
   * @param {T|null|undefined} [item]
   * @returns {T|false}
   */
  append(item) {
    if (!item) {
      return false
    }

    if (!item.append || !item.prepend || !item.detach) {
      throw new Error(
        'An argument without append, prepend, or detach methods was given to `List#append`.'
      )
    }

    // If self has a last item, defer appending to the last items append method,
    // and return the result.
    if (this.tail) {
      return this.tail.append(item)
    }

    // If self has a first item, defer appending to the first items append method,
    // and return the result.
    if (this.head) {
      return this.head.append(item)
    }

    // …otherwise, there is no `tail` or `head` item yet.
    item.detach()
    item.list = this
    this.head = item
    this.size++

    return item
  }

  /**
   * Creates an iterator from the list.
   *
   * @returns {ItemIterator<T>}
   */
  [Symbol.iterator]() {
    return new ItemIterator(this.head)
  }
}

// type-coverage:ignore-next-line
List.prototype.size = 0
// type-coverage:ignore-next-line
List.prototype.tail = null
// type-coverage:ignore-next-line
List.prototype.head = null

/**
 * Creates a new list from the items passed in.
 *
 * @template {List<T>} TheList
 * @template {Item} [T=Item]
 * @param {TheList} list
 * @param {Array<T|null|undefined>|undefined} [items]
 * @returns {TheList}
 */
function appendAll(list, items) {
  if (!items) {
    return list
  }

  if (items[Symbol.iterator]) {
    const iterator = items[Symbol.iterator]()
    /** @type {IteratorResult<T|null|undefined, null>} */
    let result

    while ((result = iterator.next()) && !result.done) {
      list.append(result.value)
    }
  } else {
    let index = -1

    while (++index < items.length) {
      const item = items[index]
      list.append(item)
    }
  }

  return list
}
