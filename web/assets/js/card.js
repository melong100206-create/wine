/* 상품 카드 마크업 (C-02 다크 갤러리 · hover 시 패키징 이미지로 크로스페이드) */
(function () {
  'use strict';
  const S = window.SONGSAN;

  S.card = function (p, i) {
    const soldout = p.stock === 0;
    const badges = [
      ...(p.badges || []).map((b) => `<span class="badge">${b}</span>`),
      soldout ? '<span class="badge soldout">SOLD OUT</span>' : '',
      p.limited && !soldout ? `<span class="badge solid">남은 ${p.stock}병</span>` : ''
    ].join('');

    return `
    <a class="p-card" href="${S.base}product.html?id=${p.id}" data-reveal data-delay="${(i % 3) + 1}">
      <div class="p-media">
        ${S.img(p.photo, p.svg, p.name, 'shot')}
        ${S.img(p.photoAlt, p.svgAlt, p.name + ' 전용 패키지', 'shot-alt')}
        <div class="p-badges">${badges}</div>
      </div>
      <div class="p-body">
        <span class="p-variety">${p.nameEn}</span>
        <h3 class="p-name">${p.name}</h3>
        <p class="p-note">${p.short}</p>
        <div class="p-foot">
          <span class="p-price num">${S.won(p.price)}<small>원 / ${p.volume}ml</small></span>
          <span class="p-more">${soldout ? 'Sold out' : 'View'}</span>
        </div>
      </div>
    </a>`;
  };
})();
