import { moveInArray, positionAfterMove } from './order';

describe('moveInArray', () => {
  it('moves an entry to the target index', () => {
    expect(moveInArray(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveInArray(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveInArray(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });
});

describe('positionAfterMove', () => {
  const cases: {
    name: string;
    all: string[];
    visible: string[];
    from: number;
    to: number;
    position: number;
    result: string[];
  }[] = [
    {
      name: 'down without filter',
      all: ['a', 'b', 'c'],
      visible: ['a', 'b', 'c'],
      from: 0,
      to: 2,
      position: 2,
      result: ['b', 'c', 'a'],
    },
    {
      name: 'up without filter',
      all: ['a', 'b', 'c'],
      visible: ['a', 'b', 'c'],
      from: 2,
      to: 0,
      position: 0,
      result: ['c', 'a', 'b'],
    },
    {
      name: 'one step down',
      all: ['a', 'b', 'c'],
      visible: ['a', 'b', 'c'],
      from: 0,
      to: 1,
      position: 1,
      result: ['b', 'a', 'c'],
    },
    {
      name: 'same place',
      all: ['a', 'b', 'c'],
      visible: ['a', 'c'],
      from: 1,
      to: 1,
      position: 2,
      result: ['a', 'b', 'c'],
    },
    {
      name: 'down past a hidden entry',
      all: ['A', 'b', 'C'],
      visible: ['A', 'C'],
      from: 0,
      to: 1,
      position: 2,
      result: ['b', 'C', 'A'],
    },
    {
      name: 'up past a hidden entry',
      all: ['A', 'b', 'C'],
      visible: ['A', 'C'],
      from: 1,
      to: 0,
      position: 0,
      result: ['C', 'A', 'b'],
    },
    {
      name: 'to the end with hidden entries',
      all: ['A', 'b', 'C', 'd', 'E'],
      visible: ['A', 'C', 'E'],
      from: 0,
      to: 2,
      position: 4,
      result: ['b', 'C', 'd', 'E', 'A'],
    },
    {
      name: 'one step with hidden entries',
      all: ['A', 'b', 'C', 'd', 'E'],
      visible: ['A', 'C', 'E'],
      from: 0,
      to: 1,
      position: 2,
      result: ['b', 'C', 'A', 'd', 'E'],
    },
    {
      name: 'to the start with hidden entries',
      all: ['A', 'b', 'C', 'd', 'E'],
      visible: ['A', 'C', 'E'],
      from: 2,
      to: 0,
      position: 0,
      result: ['E', 'A', 'b', 'C', 'd'],
    },
  ];

  for (const c of cases) {
    it(c.name, () => {
      const position = positionAfterMove(c.all, c.visible, c.from, c.to);
      expect(position).toBe(c.position);
      expect(moveInArray(c.all, c.all.indexOf(c.visible[c.from]), position)).toEqual(c.result);
    });
  }
});
