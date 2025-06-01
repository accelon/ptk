// for dictonary entries
const TerminalFlag = '$';
const PopOpetator = ')';
class TrieNode {
  char: string;
  value: any;
  terminated: boolean;
  children: {
    [char: string]: TrieNode;
  };
  constructor(char: string, value: any, terminated = false) {
    this.char = char;
    this.value = value;
    this.terminated = terminated;
    this.children = {};
  }
}
export class Trie {
  root: TrieNode;
  constructor() {
    this.root = new TrieNode('', undefined, false);
  }
  add(key: string, value = undefined) {
    const length = key.length;
    let node = this.root;
    for (let i = 0; i < length; i++) {
      const char = key.charAt(i);
      if (!node.children[char]) {
        node.children[char] = new TrieNode(char, undefined, false);
      } else if (i==length-1) {
          // throw "key already exists" + key;
          console.error('key exists',key);
      }
      node = node.children[char];
    }
    node.value = value;
    node.terminated = true;
  }
  find(key: string) {
    const length = key.length;
    let node = this.root;
    for (let i = 0; i < length; i++) {
      const char = key.charAt(i);
      if (node.children[char]) {
        node = node.children[char];
      } else {
        return undefined;
      }
    }
    return node;
  }
  keysWithPrefix(prefix: string) {
    const node = this.find(prefix);
    if (!node) {
      return [];
    }
    const result = [];
    _traverse(node, prefix.split(''), result);
    return result.sort();
  }
  serialize() {
    const stack = [];
    _serialize(this.root, stack);
    return stack.join('');
  }
  deserialize(serialized: string) {
    const list = serialized.split('');
    const length = list.length;
    const trie = new Trie();
    const chars = [];
    let index = 0, count=0;
    while (index < length) {
      const ch = list[index];
      switch (ch) {
        case TerminalFlag:
          //count is same as orginal index if sorted
          trie.add(chars.join(''), count);
          count++
          break;
        case PopOpetator:
          chars.pop();
          break;
        default:
          chars.push(ch);
          break;
      }
      index++;
    }
    return trie;
  }
  deserializeToArray(serialized: string) { //output same array as input if sorted
    const list = serialized.split('');
    const length = list.length;
    const chars = [];
    let index = 0;
    const out=[];
    while (index < length) {
      const ch = list[index];
      switch (ch) {
        case TerminalFlag:
          out.push(chars.join(''));
          break;
        case PopOpetator:
          chars.pop();
          break;
        default:
          chars.push(ch);
          break;
      }
      index++;
    }
    return out;
  }  
}
function _traverse(node: TrieNode, prefixStack: string[], result: string[]) {
  if (node.terminated) {
    result.push(prefixStack.join(''));
  }
  for (const char in node.children) {
    const child = node.children[char];
    prefixStack.push(char);
    _traverse(child, prefixStack, result);
    prefixStack.pop();
  }
}
function _serialize(node: TrieNode, stack: string[]) {  
  stack.push(node.char);
  if (node.terminated) {
    stack.push(TerminalFlag);
  }
  for (const char in node.children) {
    const child = node.children[char];
    _serialize(child, stack);
    stack.push(PopOpetator);
  }
}
