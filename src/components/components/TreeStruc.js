/* The code defines a TreeStruc class that represents a tree data structure and provides methods for
inserting, removing, and finding nodes in the tree. */
export class TreeNode {
  /**
   * The `TreeNode` class represents a node in a tree data structure.
   * @param {any} key - The key associated with the node.
   * @param {any} [value=key] - The value associated with the node. Defaults to the key.
   * @param {TreeNode} [parent=null] - The parent node of the current node. Defaults to null for the root node.
   */
  constructor(key, value = key, parent = null) {
    this.key = key;
    this.value = value;
    this.parent = parent;
    this.children = [];
  }

  /**
   * Checks if the node has any children.
   * @returns {boolean} - A boolean value indicating whether the current node is a leaf node (has no children) or not.
   */
  get isLeaf() {
    return this.children.length === 0;
  }

  /**
   * Checks if the node has children.
   * @returns {boolean} - A boolean value indicating whether the current node has children or not.
   */
  get hasChildren() {
    return !this.isLeaf;
  }
}

/* The `TreeStruc` class represents a tree data structure and provides methods for traversal,
insertion, removal, and finding nodes. */
export class TreeStruc {
  /**
   * The `TreeStruc` class represents a tree data structure.
   * @param {any} key - The key associated with the root node.
   * @param {any} [value=key] - The value associated with the root node. Defaults to the key.
   */
  constructor(key, value = key) {
    this.root = new TreeNode(key, value);
  }

  /**
   * Performs a pre-order traversal of the tree, yielding each node.
   * @param {TreeNode} [node=this.root] - The node from which to start the traversal. Defaults to the root node.
   * @returns {Generator<TreeNode, any, unknown>} - A generator that yields each node during the pre-order traversal.
   */
  *preOrderTraversal(node = this.root) {
    yield node;
    if (node.children.length) {
      for (let child of node.children) {
        yield* this.preOrderTraversal(child);
      }
    }
  }

  /**
   * Performs a post-order traversal of the tree, yielding each node.
   * @param {TreeNode} [node=this.root] - The node from which to start the traversal. Defaults to the root node.
   * @returns {Generator<TreeNode, any, unknown>} - A generator that yields each node during the post-order traversal.
   */
  *postOrderTraversal(node = this.root) {
    if (node.children.length) {
      for (let child of node.children) {
        yield* this.postOrderTraversal(child);
      }
    }
    yield node;
  }

  /**
   * Inserts a new node with the specified key and optional value under the node with the given parent node key.
   * @param {any} parentNodeKey - The key of the parent node under which to insert the new node.
   * @param {any} key - The key associated with the new node.
   * @param {any} [value=key] - The value associated with the new node. Defaults to the key.
   * @returns {boolean} - A boolean value indicating whether the insertion is successful or not.
   */
  insert(parentNodeKey, key, value = key) {
    for (let node of this.preOrderTraversal()) {
      if (node.key === parentNodeKey) {
        node.children.push(new TreeNode(key, value, node));
        return true;
      }
    }
    return false;
  }

  /**
   * Removes the node with the specified key from the tree.
   * @param {any} key - The key of the node to remove.
   * @returns {boolean} - A boolean value indicating whether the removal is successful or not.
   */
  remove(key) {
    for (let node of this.preOrderTraversal()) {
      const filtered = node.children.filter(c => c.key !== key);
      if (filtered.length !== node.children.length) {
        node.children = filtered;
        return true;
      }
    }
    return false;
  }

  /**
   * Finds a node with the specified key in the tree.
   * @param {any} key - The key of the node to find.
   * @returns {TreeNode|undefined} - The found node, or undefined if the node is not found.
   */
  find(key) {
    for (let node of this.preOrderTraversal()) {
      if (node.key === key) return node;
    }
    return undefined;
  }
}