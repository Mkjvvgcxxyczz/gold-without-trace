import './style.css'

const titles = [
'الرسالة المجهولة','اللقاء الأول','سر الصندوق','عيون ليان',
'الطريق المظلم','أول خيانة','ماضي أحمد','المفتاح الذهبي',
'اختفاء ليان','الحقيقة الأولى','عودة الغريب','ليلة الاعتراف',
'الذهب المفقود','سر العائلة','الرسالة الأخيرة','بين الحب والخيانة',
'الحقيقة المؤلمة','المواجهة','ذهب بدون أثر','النهاية التي لم يتوقعها أحد'
]

let currentPart = 0
let currentPage = 1

const app = document.querySelector('#app')

function renderHome() {
  app.innerHTML = `
    <header>
      <div class="brand">✦ ذهب بدون أثر ✦</div>
      <div class="subtitle">حكاية أحمد وليان</div>
    </header>

    <div class="welcome">
      <span>✧ أهلاً بك في عالم الحكايات ✧</span>
      <h1>ذهب بدون أثر</h1>
      <p>بعض الأسرار لا تموت، وبعض الحكايات لا تنتهي.</p>
      <button class="gold-btn" id="start">ابدأ القراءة</button>
    </div>

    <div class="ticker">
      <span>✦ أهلاً بكم في رواية ذهب بدون أثر ✦ رحلة أحمد وليان تبدأ من هنا ✦</span>
    </div>

    <section class="intro">
      <div class="cover">
        <div class="cover-symbol">✧</div>
        <h2>ذهب<br>بدون أثر</h2>
        <p>قصة أحمد وليان</p>
        <div class="cover-bottom">رواية من 20 جزءاً</div>
      </div>
      <div class="intro-text">
        <h2>حين يصبح الماضي لغزاً</h2>
        <p>رسالة غامضة، صندوق قديم، وحكاية حب تواجه أسراراً لم يكن أحد يتوقعها.</p>
        <p>اكتشف حكاية أحمد وليان، صفحة بعد صفحة.</p>
      </div>
    </section>

    <section class="parts">
      <h2>فصول الرواية</h2>
      <p class="muted">اختر الجزء الذي تريد قراءته</p>
      <div class="part-grid">
        ${titles.map((title,i)=>`
          <button class="part-card" data-part="${i}">
            <span class="number">${String(i+1).padStart(2,'0')}</span>
            <span>${title}</span>
            <small>10 صفحات</small>
          </button>
        `).join('')}
      </div>
    </section>

    <footer>ذهب بدون أثر © 2026<br>كل الحكايات تبدأ بخطوة</footer>
  `

  document.querySelector('#start').onclick = () => {
    document.querySelector('.parts').scrollIntoView({behavior:'smooth'})
  }

  document.querySelectorAll('[data-part]').forEach(button => {
    button.onclick = () => {
      currentPart = Number(button.dataset.part)
      currentPage = 1
      renderPage()
    }
  })
}

function renderPage() {
  app.innerHTML = `
    <div class="reader">
      <button class="back" id="back">← العودة للأجزاء</button>
      <div class="reader-heading">
        <span>الجزء ${currentPart+1} من 20</span>
        <h1>${titles[currentPart]}</h1>
        <div class="progress"><span style="width:${currentPage*10}%"></span></div>
        <small>الصفحة ${currentPage} من 10</small>
      </div>

      <article>
        <h2>${titles[currentPart]}</h2>
        <p class="story-text">
          هنا تبدأ حكاية الجزء ${currentPart+1} من رواية ذهب بدون أثر.
          ستجد في هذا الفصل تفاصيل رحلة أحمد وليان والأسرار التي تربط بينهما.
          ترقب الأحداث القادمة، فكل صفحة تقود إلى حقيقة جديدة.
        </p>
        <p class="muted">نص الرواية النهائي سيضاف إلى هذه الصفحات ضمن مراحل كتابة القصة.</p>
      </article>

      <div class="page-controls">
        <button id="previous" ${currentPage===1?'disabled':''}>الصفحة السابقة</button>
        <span>${currentPage} / 10</span>
        <button id="next">${currentPage===10?'الجزء التالي':'الصفحة التالية'}</button>
      </div>
    </div>
  `

  document.querySelector('#back').onclick = renderHome

  document.querySelector('#previous').onclick = () => {
    if(currentPage>1) {
      currentPage--
      renderPage()
    }
  }

  document.querySelector('#next').onclick = () => {
    if(currentPage<10) {
      currentPage++
      renderPage()
    } else if(currentPart<19) {
      currentPart++
      currentPage=1
      renderPage()
    } else {
      renderHome()
    }
  }
}

renderHome()
