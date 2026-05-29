import {
  depositChannels,
  defaultSelectedDepositChannels,
  gameOptions,
  providerOptions,
} from './newMemberTriDepositData';

export { depositChannels, defaultSelectedDepositChannels, gameOptions, providerOptions };

export const kycFreespinDefaultConfig = {
  kycLevel: 'T2',           // T1 | T2 | T3
  claimLimitPerUser: 1,
  triggerTiming: 'instant', // instant | delayed
  delayDays: 0,
  requireFirstDeposit: 'no', // yes | no
  fsCount: 10,
  betAmount: 0.20,
  validityDays: 7,
};
