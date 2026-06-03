export const NEXUS_REGISTRY = '0x3cB2875EE76c5E83086a372d41D11c6191959152';
export const NEXUS_VAULT = '0xE7abf67c29e823417C06220D78Ab64DfF3232A94';
export const NEXUS_ESCROW = '0x967d33C5A3c5E4736BEf61489745A721c4ca7031';
export const NEXUS_JOB_ENGINE = '0xCC95A48caa7927A4a9B92a8903D09ab251d77126';
export const NEXUS_AUDIT_ENGINE = '0x3b28D6d54DaEFFe3283d6DF416C5d0b3CC4DEE4A';
export const NEXUS_CHAIN_ID = 50312;

export const registryABI = [
  {
    type: 'function' as const,
    name: 'registerAgent',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'description', type: 'string', internalType: 'string' },
      { name: 'ipfsHash', type: 'string', internalType: 'string' },
      { name: 'capabilities', type: 'bytes32[]', internalType: 'bytes32[]' },
      { name: 'pricingModel', type: 'uint8', internalType: 'uint8' },
      { name: 'basePrice', type: 'uint256', internalType: 'uint256' },
      { name: 'parentAgent', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: 'agentId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'payable' as const,
  },
  {
    type: 'function' as const,
    name: 'MIN_STAKE',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view' as const,
  },
];
