
import { IBO } from '../types';

export const normalizeId = (id: string) => (id || "").toString().replace(/^0+/, '').trim();

export interface TreeStats {
  bbs: number;
  wes: number;
  cep: number;
  vpg: number;
  recruits: number;
}

export const buildChildrenMap = (network: IBO[]): Map<string, IBO[]> => {
  const map = new Map<string, IBO[]>();
  network.forEach(ibo => {
    if (!ibo.uplineId) return;
    const pId = normalizeId(ibo.uplineId);
    if (!map.has(pId)) map.set(pId, []);
    map.get(pId)?.push(ibo);
  });
  return map;
};

export const getDescendantsIds = (rootId: string, childrenMap: Map<string, IBO[]>): string[] => {
  let results: string[] = [];
  const stack = [...(childrenMap.get(normalizeId(rootId)) || [])];
  const visited = new Set<string>();
  while(stack.length > 0) {
    const node = stack.pop()!;
    const nid = normalizeId(node.id);
    if(visited.has(nid)) continue;
    visited.add(nid);
    results.push(node.id);
    const children = childrenMap.get(nid);
    if(children) children.forEach(c => stack.push(c));
  }
  return results;
};

export const calculateNetworkStats = (network: IBO[], filterMonth: string = 'ALL'): Map<string, TreeStats> => {
  const childrenMap = buildChildrenMap(network);
  const cache = new Map<string, TreeStats>();

  const calculate = (id: string, visited: Set<string>): TreeStats => {
    const nId = normalizeId(id);
    if (cache.has(nId)) return cache.get(nId)!;
    if (visited.has(nId)) return { bbs: 0, wes: 0, cep: 0, vpg: 0, recruits: 0 };
    visited.add(nId);
    
    const node = network.find(n => normalizeId(n.id) === nId);
    let stats = {
      bbs: Number(node?.vitalSigns.bbsTickets || 0),
      wes: Number(node?.vitalSigns.wesTickets || 0),
      cep: node?.vitalSigns.hasCEP ? 1 : 0,
      vpg: Number(node?.vitalSigns.groupPV || 0),
      recruits: 0
    };

    const children = childrenMap.get(nId) || [];
    children.forEach(child => {
      const childStats = calculate(child.id, new Set(visited));
      stats.bbs += childStats.bbs;
      stats.wes += childStats.wes;
      stats.cep += childStats.cep;
      stats.recruits += (childStats.recruits + 1);
    });

    cache.set(nId, stats);
    return stats;
  };

  network.forEach(n => calculate(n.id, new Set()));
  return cache;
};
