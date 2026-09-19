/* ==========================================================================
   송산언덕 포도원 · 프로토타입 데이터
   실제 구축 시 이 파일은 API(GET /products, /programs)로 교체된다. (설계도 10장)
   ========================================================================== */

window.SONGSAN = window.SONGSAN || {};

/** 다음 출고 회차 — 실제로는 서버의 출고 스케줄에서 내려온다 */
SONGSAN.nextShipDate = '2026-10-02';

SONGSAN.brand = {
  name: '송산언덕 포도원',
  nameEn: 'SONGSAN HILL VINEYARD',
  claim: '열흘을 기다려 열흘 안에 보냅니다',
  bizName: '송산언덕 포도원',
  owner: '김동석',
  addr: '경기도 화성시 송산면 포도원길 00',
  bizNo: '000-00-00000',
  mailOrderNo: '제2026-경기화성-0000호',
  liquorNo: '지역특산주 제조면허 제0000호',
  tel: '031-000-0000',
  email: 'order@songsanhill.kr',
  hours: '평일 10:00 – 17:00 (주말·공휴일 휴무)'
};

SONGSAN.products = [
  {
    id: 'campbell-dry',
    name: '캠벨 얼리 드라이',
    nameEn: 'CAMPBELL EARLY · DRY',
    variety: '캠벨 얼리 100%',
    year: '2026 빈티지',
    abv: 12.0,
    volume: 750,
    price: 19000,
    badges: ['2026 VINTAGE'],
    limited: null,
    stock: 148,
    short: '첫 향은 자두, 끝은 마른 흙. 군더더기 없이 마른 맛으로 떨어진다.',
    tasting: { '당도': 2, '산도': 4, '바디': 3, '탄닌': 3 },
    notes: ['붉은 자두', '블랙커런트', '마른 장미', '젖은 흙'],
    temp: '14 – 16℃',
    photo: 'bottle-campbell',
    photoAlt: 'box-closed',
    svg: 'bottle-campbell.svg',
    svgAlt: 'box-campbell.svg',
    story: '수확한 포도를 열흘 안에 병에 담는다는 원칙에서 가장 정직하게 드러나는 술. 잔당을 남기지 않아 캠벨 특유의 향이 단맛 뒤로 숨지 않는다.',
    pairing: [
      { img: 'pair-1', svg: 'pair-1.svg', title: '숯불 한우 등심', desc: '지방의 단맛을 산도가 끊어 준다. 굽자마자, 소금만.' },
      { img: 'pair-3', svg: 'pair-3.svg', title: '숙성 경성치즈', desc: '짠맛과 마른 흙 향이 한 축으로 붙는다.' },
      { img: 'pair-2', svg: 'pair-2.svg', title: '오리 콩피', desc: '기름진 껍질에 자두 향이 얹힌다.' }
    ]
  },
  {
    id: 'mba-medium',
    name: '머스캣 베일리 에이',
    nameEn: 'MUSCAT BAILEY A · MEDIUM',
    variety: 'MBA 100%',
    year: '2026 빈티지',
    abv: 12.5,
    volume: 750,
    price: 23000,
    badges: ['BEST SELLER'],
    limited: null,
    stock: 96,
    short: '딸기잼과 감초. 부드럽게 퍼지고 길게 남는다.',
    tasting: { '당도': 3, '산도': 3, '바디': 4, '탄닌': 2 },
    notes: ['딸기잼', '감초', '흑설탕', '삼나무'],
    temp: '15 – 17℃',
    photo: 'bottle-mba',
    photoAlt: 'box-closed',
    svg: 'bottle-mba.svg',
    svgAlt: 'box-mba.svg',
    story: '탄닌을 눌러 두고 향을 앞세운 구성. 와인을 처음 여는 자리에 내놓아도 설명이 필요 없다.',
    pairing: [
      { img: 'pair-2', svg: 'pair-2.svg', title: '오리 가슴살', desc: '베리 리덕션과 같은 결로 이어진다.' },
      { img: 'pair-1', svg: 'pair-1.svg', title: '간장 양념 갈비', desc: '단짠 양념을 감초 향이 받친다.' },
      { img: 'pair-3', svg: 'pair-3.svg', title: '무화과와 호두', desc: '디저트 없이 끝내는 마지막 잔.' }
    ]
  },
  {
    id: 'onggi-limited',
    name: '열흘의 원칙 · 항아리 발효',
    nameEn: 'ONGGI FERMENTED · LIMITED 300',
    variety: '캠벨 얼리 · 옹기 발효',
    year: '2026 한정 300병',
    abv: 13.0,
    volume: 750,
    price: 39000,
    badges: ['LIMITED 300', 'ONGGI'],
    limited: 300,
    stock: 41,
    short: '스테인리스 대신 옹기에서 발효했다. 숨 쉬는 그릇이 만든 결.',
    tasting: { '당도': 2, '산도': 4, '바디': 5, '탄닌': 4 },
    notes: ['말린 대추', '흑차', '삼나무', '간장 향'],
    temp: '16 – 18℃',
    photo: 'bottle-jar',
    photoAlt: 'box-open',
    svg: 'bottle-jar.svg',
    svgAlt: 'box-jar.svg',
    story: '옹기는 미세하게 숨을 쉰다. 통제하기 어렵고 실패도 나오지만, 성공한 통에서만 나오는 결이 있다. 매년 이 술은 딱 그만큼만 만든다.',
    pairing: [
      { img: 'pair-1', svg: 'pair-1.svg', title: '드라이에이징 한우', desc: '숙성향끼리 맞붙는 조합.' },
      { img: 'pair-3', svg: 'pair-3.svg', title: '블루치즈', desc: '강한 짠맛을 바디가 받아 낸다.' },
      { img: 'pair-2', svg: 'pair-2.svg', title: '간장 조림', desc: '간장 향이 다리를 놓는다.' }
    ]
  },
  {
    id: 'campbell-rose',
    name: '캠벨 로제',
    nameEn: 'CAMPBELL ROSÉ · SEMI-SWEET',
    variety: '캠벨 얼리 · 단시간 침용',
    year: '2026 빈티지',
    abv: 11.0,
    volume: 750,
    price: 21000,
    badges: ['CHILLED'],
    limited: null,
    stock: 0,
    short: '옅은 살구빛. 차게 식혀 첫 잔으로.',
    tasting: { '당도': 4, '산도': 4, '바디': 2, '탄닌': 1 },
    notes: ['흰 복숭아', '자몽 껍질', '장미', '라임'],
    temp: '8 – 10℃',
    photo: 'bottle-rose',
    photoAlt: 'box-closed',
    svg: 'bottle-rose.svg',
    svgAlt: 'box-rose.svg',
    story: '껍질을 오래 두지 않는다. 색이 옅어질 때까지 기다렸다가 분리한다.',
    pairing: [
      { img: 'pair-3', svg: 'pair-3.svg', title: '생 무화과', desc: '차갑게, 아무것도 더하지 않고.' },
      { img: 'pair-2', svg: 'pair-2.svg', title: '흰살 생선 세비체', desc: '산도끼리 맞춘다.' },
      { img: 'pair-1', svg: 'pair-1.svg', title: '수육', desc: '기름을 씻어 내는 역할.' }
    ]
  }
];

/** C-05 체험농장 프로그램 */
SONGSAN.programs = [
  {
    id: 'tour-private',
    name: '프라이빗 빈야드 테이스팅',
    en: 'PRIVATE VINEYARD TASTING',
    price: 45000,
    unit: '1인',
    cap: '회당 6인 한정',
    dur: '90분',
    items: ['포도밭 해질녘 동행', '4종 전량 테이스팅', '항아리 발효실 개방', '테이스팅 노트 카드 증정']
  },
  {
    id: 'tour-harvest',
    name: '수확 동행 · 열흘의 원칙',
    en: 'HARVEST DAY',
    price: 60000,
    unit: '1인',
    cap: '9–10월 주말 한정',
    dur: '180분',
    items: ['새벽 수확 참여', '선별·파쇄 과정 참관', '농가 점심 제공', '수확 회차 와인 1병 포함']
  },
  {
    id: 'tour-family',
    name: '가족 포도 따기',
    en: 'FAMILY PICKING',
    price: 25000,
    unit: '1인 (미취학 무료)',
    cap: '회당 20인',
    dur: '60분',
    items: ['생식용 포도 2kg 수확', '포도 주스 시음', '주류 시음 미포함', '주차 무료']
  }
];

SONGSAN.shipping = { fee: 3500, freeFrom: 6, note: '6병 이상 주문 시 배송비 무료' };
