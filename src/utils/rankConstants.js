export const RANK_THRESHOLDS = {
  IRON: 0,
  BRONZE: 5000000,    // 5 triệu
  SILVER: 15000000,   // 15 triệu
  GOLD: 30000000,     // 30 triệu
  PLATINUM: 50000000, // 50 triệu
  DIAMOND: 80000000   // 80 triệu
};

export const RANK_NAMES = {
  IRON: 'Sắt',
  BRONZE: 'Đồng',
  SILVER: 'Bạc',
  GOLD: 'Vàng',
  PLATINUM: 'Bạch Kim',
  DIAMOND: 'Kim Cương'
};

export const RANK_COLORS = {
  IRON: '#6B7280',
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
  DIAMOND: '#B9F2FF'
};

export const SPIN_REWARDS = [
  { id: 1, name: 'Giảm 10%', value: 10, type: 'PERCENTAGE', probability: 20 },
  { id: 2, name: 'Giảm 20%', value: 20, type: 'PERCENTAGE', probability: 15 },
  { id: 3, name: 'Giảm 50.000đ', value: 50000, type: 'FIXED_AMOUNT', probability: 25 },
  { id: 4, name: 'Giảm 100.000đ', value: 100000, type: 'FIXED_AMOUNT', probability: 15 },
  { id: 5, name: 'Giảm 200.000đ', value: 200000, type: 'FIXED_AMOUNT', probability: 10 },
  { id: 6, name: 'Miễn phí vận chuyển', value: 0, type: 'FREE_SHIPPING', probability: 10 },
  { id: 7, name: 'Chúc may mắn lần sau', value: 0, type: 'NONE', probability: 5 }
];

export const getNextRank = (currentRank) => {
  const ranks = Object.keys(RANK_THRESHOLDS);
  const currentIndex = ranks.indexOf(currentRank);
  return currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null;
};

export const getRankProgress = (totalSpent, currentRank) => {
  const currentThreshold = RANK_THRESHOLDS[currentRank];
  const nextRank = getNextRank(currentRank);
  
  if (!nextRank) {
    return 100; // Đã đạt rank cao nhất
  }
  
  const nextThreshold = RANK_THRESHOLDS[nextRank];
  const progress = ((totalSpent - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};
