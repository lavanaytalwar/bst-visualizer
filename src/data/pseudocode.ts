import { PseudocodeBlock } from '../types';

export const PSEUDOCODE: PseudocodeBlock[] = [
  {
    id: 'insert',
    title: 'INSERT(x)',
    lines: [
      '1  INSERT(x):',
      '2    if root = ∅: root ← new(x)',
      '3    else:',
      '4      cur ← root',
      '5      while cur ≠ ∅:',
      '6        if x < cur.key:',
      '7          if cur.left = ∅: cur.left ← new(x); break',
      '8          cur ← cur.left',
      '9        else if x > cur.key:',
      '10         if cur.right = ∅: cur.right ← new(x); break',
      '11         cur ← cur.right',
      '12       else:',
      '13         apply duplicate policy',
    ],
  },
  {
    id: 'search',
    title: 'SEARCH(x)',
    lines: [
      '1  SEARCH(x):',
      '2    cur ← root',
      '3    while cur ≠ ∅:',
      '4      if x = cur.key: return cur',
      '5      if x < cur.key: cur ← cur.left',
      '6      else: cur ← cur.right',
      '7    return ∅',
    ],
  },
  {
    id: 'delete',
    title: 'DELETE(x)',
    lines: [
      '1  DELETE(x):',
      '2    node ← SEARCH(x)',
      '3    if node = ∅: return',
      '4    if node.left = ∅:',
      '5      TRANSPLANT(node, node.right)',
      '6    else if node.right = ∅:',
      '7      TRANSPLANT(node, node.left)',
      '8    else:',
      '9      succ ← MIN(node.right)',
      '10     if succ.parent ≠ node:',
      '11       TRANSPLANT(succ, succ.right)',
      '12       succ.right ← node.right',
      '13     TRANSPLANT(node, succ)',
      '14     succ.left ← node.left',
    ],
  },
  {
    id: 'traverse',
    title: 'TRAVERSE(kind)',
    lines: [
      '1  if kind = IN:',
      '2    recurse left, visit, recurse right',
      '3  if kind = PRE:',
      '4    visit, recurse left, recurse right',
      '5  if kind = POST:',
      '6    recurse left, recurse right, visit',
      '7  if kind = LEVEL:',
      '8    enqueue root',
      '9    while queue ≠ ∅:',
      '10     node ← dequeue',
      '11     visit node',
      '12     enqueue children if present',
    ],
  },
];

export const blockForStep = (stepOp: 'insert' | 'delete' | 'search' | 'traverse' | undefined): PseudocodeBlock['id'] | '' =>
  stepOp ? (stepOp === 'traverse' ? 'traverse' : stepOp) : '';
