/*
 * JCain Engineering · shell compartido
 * ------------------------------------
 * Este archivo construye automáticamente:
 * - header global;
 * - footer y perfiles académicos;
 * - tarjetas de materias y contadores del portal;
 * - mapa/temario de cada materia;
 * - navegación lateral de las clases;
 * - enlaces anterior/siguiente entre clases publicadas.
 *
 * Los datos provienen de assets/data/site-data.js, generado por
 * scripts/build_site.py en cada despliegue de GitHub Pages.
 */
(() => {
  'use strict';

  const DATA = window.JCAIN_SITE_DATA;
  if (!DATA) {
    console.error('JCain Engineering: no se encontró window.JCAIN_SITE_DATA. Ejecuta scripts/build_site.py.');
    return;
  }

  const SITE = DATA.site || {};
  const BASE = SITE.basePath && SITE.basePath !== '/' ? SITE.basePath.replace(/\/$/, '') : '';

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const siteUrl = (path = '/') => {
    if (/^(https?:|mailto:|tel:|#)/i.test(path)) return path;
    const clean = path.startsWith('/') ? path : `/${path}`;
    if (!BASE) return clean;
    if (clean === BASE || clean.startsWith(`${BASE}/`)) return clean;
    return `${BASE}${clean}`;
  };

  const topicId = (number = '') => `tema-${String(number).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  const lessonCountLabel = (n) => `${n} ${n === 1 ? 'clase publicada' : 'clases publicadas'}`;

  function currentContext() {
    const body = document.body;
    let courseSlug = body.dataset.course || '';
    let lessonSlug = body.dataset.lesson || '';

    let pathname = window.location.pathname;
    if (BASE && pathname.startsWith(BASE)) pathname = pathname.slice(BASE.length) || '/';
    const parts = pathname.split('/').filter(Boolean);
    if (!courseSlug && parts[0] === 'cursos' && parts[1]) courseSlug = parts[1];
    if (!lessonSlug && parts[0] === 'cursos' && parts[2]) lessonSlug = parts[2];

    const course = (DATA.courses || []).find((item) => item.slug === courseSlug) || null;
    const lesson = course?.lessons?.find((item) => item.slug === lessonSlug) || null;
    return { courseSlug, lessonSlug, course, lesson };
  }

  function profileLinks(compact = false) {
    return `
      <nav class="academic-profiles${compact ? ' academic-profiles--compact' : ''}" aria-label="Perfiles académicos">
        ${(DATA.profiles || []).map((profile) => `
          <a href="${esc(profile.url)}" target="_blank" rel="noopener noreferrer" class="academic-link">
            <img src="${esc(siteUrl(profile.icon))}" alt="${esc(profile.alt || profile.label)}" class="academic-icon">
            <span>${esc(profile.label)}</span>
          </a>`).join('')}
      </nav>`;
  }

  function renderSiteHeader() {
    document.querySelectorAll('[data-site-header]').forEach((host) => {
      host.innerHTML = `
        <header class="portal-topbar">
          <a class="portal-brand" href="${siteUrl('/')}">
            <span class="portal-mark">${esc(SITE.brandMark || 'JE')}</span>
            <span><strong>${esc(SITE.name || 'JCain Engineering')}</strong><small>Portal académico</small></span>
          </a>
          <nav aria-label="Navegación principal">
            ${(DATA.homeNavigation || []).map((item) => `<a href="${esc(siteUrl(item.url))}">${esc(item.label)}</a>`).join('')}
          </nav>
        </header>`;
    });
  }

  function renderSiteFooter() {
    document.querySelectorAll('[data-site-footer]').forEach((host) => {
      host.innerHTML = `
        <footer class="site-footer">
          <div class="footer-info">
            <strong class="footer-title">${esc(SITE.name)}</strong>
            <span class="footer-description">${esc(SITE.tagline)}</span>
          </div>
          ${profileLinks(false)}
          <div class="footer-copyright">© ${esc(SITE.copyrightYear)} ${esc(SITE.owner)}</div>
        </footer>`;
    });
  }

  function renderHome() {
    const courseGrid = document.querySelector('[data-course-grid]');
    if (!courseGrid) return;

    const stats = DATA.stats || {};
    document.querySelectorAll('[data-course-count]').forEach((el) => { el.textContent = stats.courseCount ?? 0; });
    document.querySelectorAll('[data-total-lessons]').forEach((el) => { el.textContent = stats.publishedLessonCount ?? 0; });
    document.querySelectorAll('[data-total-lessons-label]').forEach((el) => { el.textContent = lessonCountLabel(stats.publishedLessonCount ?? 0); });

    courseGrid.innerHTML = (DATA.courses || []).map((course) => {
      const active = course.publishedCount > 0;
      return `
        <a class="course-card${active ? ' current' : ''}" href="${esc(course.url)}">
          <span class="course-code">${esc(lessonCountLabel(course.publishedCount))}</span>
          <h3>${esc(course.title)}</h3>
          <p>${esc(course.description)}</p>
          <footer><span>${esc(course.statusLabel)}</span><strong>${active ? 'Entrar' : 'Abrir'} →</strong></footer>
        </a>`;
    }).join('');

    const published = DATA.publishedLessons || [];
    const summary = document.querySelector('[data-published-summary]');
    if (summary) {
      if (!published.length) {
        summary.textContent = 'Las clases publicadas aparecerán aquí automáticamente.';
      } else {
        const grouped = (DATA.courses || [])
          .filter((course) => course.publishedCount > 0)
          .map((course) => `${course.shortTitle || course.title}: ${course.publishedCount}`);
        summary.textContent = grouped.join(' · ');
      }
    }

    const tags = document.querySelector('[data-published-tags]');
    if (tags) {
      tags.innerHTML = published.slice(-6).reverse().map((lesson) => `<span>${esc(lesson.number ? `${lesson.number} · ${lesson.title}` : lesson.title)}</span>`).join('');
    }
  }

  function courseTree(course) {
    if (!course.units?.length) {
      return `<div class="sidebar-empty">El temario se incorporará aquí conforme se prepare la materia.</div>`;
    }
    return `
      <nav class="syllabus-tree" aria-label="Temario de ${esc(course.title)}">
        <a class="tree-home active" href="${esc(course.url)}">⌂ Inicio</a>
        ${course.units.map((unit) => `
          <section class="tree-unit">
            <div class="tree-unit-title"><strong>${esc(unit.label)}</strong><span>${esc(unit.title)}</span></div>
            ${(unit.topics || []).map((topic) => {
              if (topic.children?.length) {
                const anyPublished = topic.children.some((child) => child.published);
                return `
                  <div class="tree-group${anyPublished ? ' current-group' : ''}">
                    <div class="tree-group-label">${esc(topic.number)} ${esc(topic.title)} <span>${anyPublished ? 'En desarrollo' : 'Próximamente'}</span></div>
                    ${topic.children.map((child) => child.published
                      ? `<a class="tree-sub current" href="${esc(child.url)}">${esc(child.number)} ${esc(child.title)} <em>Publicada</em></a>`
                      : `<a class="tree-sub planned" href="#${topicId(child.number)}">${esc(child.number)} ${esc(child.title)} <em>Próximamente</em></a>`).join('')}
                  </div>`;
              }
              return topic.published
                ? `<a class="current" href="${esc(topic.url)}">${esc(topic.number)} ${esc(topic.title)} <em>Publicada</em></a>`
                : `<a class="planned" href="#${topicId(topic.number)}">${esc(topic.number)} ${esc(topic.title)} <em>Próximamente</em></a>`;
            }).join('')}
          </section>`).join('')}
      </nav>`;
  }

  function curriculumHtml(course) {
    if (!course.units?.length) {
      return `
        <div class="placeholder">
          <strong>Temario en preparación</strong>
          <p>La estructura de esta materia ya está integrada al portal. Cuando se añada el temario o la primera clase, los contadores y listados se actualizarán automáticamente.</p>
        </div>`;
    }

    return `<div class="curriculum-stack">
      ${course.units.map((unit, unitIndex) => `
        <article class="curriculum-unit unit-${['one', 'two', 'three'][(unitIndex % 3)]}">
          <header><span>${esc(unit.label)}</span><div><h3>${esc(unit.title)}</h3><p>${esc(unit.description || '')}</p></div></header>
          <div class="curriculum-topics">
            ${(unit.topics || []).map((topic) => {
              if (topic.children?.length) {
                const anyPublished = topic.children.some((child) => child.published);
                return `
                  <div class="topic-expanded" id="${topicId(topic.number)}">
                    <div class="topic-expanded-head"><strong>${esc(topic.number)}</strong><span>${esc(topic.title)}</span><em>${anyPublished ? 'En desarrollo' : 'Próximamente'}</em></div>
                    <div class="expanded-subtopics">
                      ${topic.children.map((child) => child.published
                        ? `<a id="${topicId(child.number)}" href="${esc(child.url)}"><b>${esc(child.number)}</b><span>${esc(child.title)}</span><small class="published">Publicada →</small></a>`
                        : `<div id="${topicId(child.number)}"><b>${esc(child.number)}</b><span>${esc(child.title)}</span><small>Próximamente</small></div>`).join('')}
                    </div>
                  </div>`;
              }
              return topic.published
                ? `<a class="curriculum-topic-row curriculum-topic-published" id="${topicId(topic.number)}" href="${esc(topic.url)}"><strong>${esc(topic.number)}</strong><span>${esc(topic.title)}</span><em>Publicada →</em></a>`
                : `<div class="curriculum-topic-row" id="${topicId(topic.number)}"><strong>${esc(topic.number)}</strong><span>${esc(topic.title)}</span><em>Próximamente</em></div>`;
            }).join('')}
          </div>
        </article>`).join('')}
    </div>`;
  }

  function lessonCards(course) {
    if (!course.lessons?.length) {
      return `
        <div class="placeholder">
          <strong>Aún no hay clases publicadas</strong>
          <p>Al agregar una carpeta de clase con su <code>index.html</code>, esta sección y el contador de la materia se actualizan durante el despliegue.</p>
        </div>`;
    }
    return `<div class="lesson-list">
      ${course.lessons.map((lesson) => `
        <a class="lesson-card" href="${esc(lesson.url)}">
          <div class="lesson-index">${esc(lesson.number || 'Clase')}</div>
          <div><h3>${esc(lesson.title)}</h3><p>${esc(lesson.summary || 'Clase publicada.')}</p></div>
          <span class="state">Publicada</span>
        </a>`).join('')}
    </div>`;
  }

  function renderCoursePage(course) {
    const sidebar = document.querySelector('[data-course-sidebar]');
    const banner = document.querySelector('[data-course-banner]');
    const curriculum = document.querySelector('[data-course-curriculum]');
    const lessons = document.querySelector('[data-course-lessons]');
    if (!sidebar || !banner || !curriculum || !lessons) return;

    const metaPills = [course.code, course.hours, course.credits, lessonCountLabel(course.publishedCount)].filter(Boolean);
    sidebar.innerHTML = `
      <a class="back-link" href="${siteUrl('/#materias')}">← Todas las materias</a>
      <p class="eyebrow">Materia</p>
      <h1>${esc(course.title)}</h1>
      <p>${esc(course.description)}</p>
      <div class="status-pills">${metaPills.map((item) => `<span>${esc(item)}</span>`).join('')}<span>${esc(course.statusLabel)}</span></div>
      ${courseTree(course)}
      <div class="sidebar-course-template"><strong>Estructura de cada tema</strong>${(DATA.lessonTemplate || []).slice(0, 4).map((item) => `<span>${esc(item)}</span>`).join('')}</div>`;

    const recent = course.lessons?.slice(-2) || [];
    banner.innerHTML = `
      <div class="course-banner course-banner-featured">
        <p class="eyebrow">Página de la materia</p>
        <h2>${esc(course.title)}</h2>
        <p>${esc(course.banner || course.description)}</p>
        ${recent.length ? `<div class="banner-actions">${recent.map((lesson) => `<a class="portal-primary" href="${esc(lesson.url)}">${esc(lesson.number ? `${lesson.number} · ` : '')}${esc(lesson.title)} →</a>`).join('')}</div>` : ''}
      </div>`;

    curriculum.innerHTML = curriculumHtml(course);
    lessons.innerHTML = lessonCards(course);

    document.querySelectorAll('[data-current-course-count]').forEach((el) => { el.textContent = lessonCountLabel(course.publishedCount); });
    document.querySelectorAll('[data-current-course-title]').forEach((el) => { el.textContent = course.title; });
  }

  function lessonSidebar(course, lesson) {
    const meta = [course.code, course.hours, course.credits].filter(Boolean);
    return `
      <a class="portal-back" href="${siteUrl('/')}">← ${esc(SITE.name)}</a>
      <div class="brand">
        <div class="brand-mark">${esc(course.mark || 'JE')}</div>
        <div><p class="eyebrow">${esc(course.program || 'Materia')}</p><h1>${esc(course.shortTitle || course.title)}</h1></div>
      </div>
      ${meta.length ? `<div class="course-meta">${meta.map((item) => `<span>${esc(item)}</span>`).join('')}</div>` : ''}
      <nav class="course-nav" id="courseNav" aria-label="Temario de ${esc(course.title)}">
        <a class="nav-item nav-home" href="${esc(course.url)}"><span class="nav-icon">⌂</span><span>Inicio de la materia</span></a>
        ${(course.units || []).map((unit) => `
          <section class="nav-unit">
            <button class="unit-toggle" aria-expanded="true" type="button"><span><strong>${esc(unit.label)}</strong> · ${esc(unit.title)}</span><span>⌄</span></button>
            <div class="unit-links">
              ${(unit.topics || []).map((topic) => {
                if (topic.children?.length) {
                  const groupCurrent = topic.children.some((child) => child.slug === lesson.slug || child.actualFolder === lesson.slug);
                  return `
                    <button class="${groupCurrent ? 'topic-current' : ''}" type="button">${esc(topic.number)} ${esc(topic.title)} ${groupCurrent ? '<span>Actual</span>' : ''}</button>
                    <div class="subtopics">
                      ${topic.children.map((child) => {
                        const isCurrent = child.slug === lesson.slug || child.actualFolder === lesson.slug;
                        if (child.published) {
                          return `<a class="${isCurrent ? 'subtopic-active' : ''}" href="${isCurrent ? '#lesson' : esc(child.url)}">${esc(child.number)} ${esc(child.title)}${isCurrent ? '<span>Actual</span>' : '<span>Publicada</span>'}</a>`;
                        }
                        return `<button data-planned="true" type="button">${esc(child.number)} ${esc(child.title)}<span>Próximamente</span></button>`;
                      }).join('')}
                    </div>`;
                }
                const isCurrent = topic.slug === lesson.slug || topic.actualFolder === lesson.slug;
                if (topic.published) {
                  return `<a class="${isCurrent ? 'topic-current' : ''}" href="${isCurrent ? '#lesson' : esc(topic.url)}">${esc(topic.number)} ${esc(topic.title)}${isCurrent ? '<span>Actual</span>' : '<span>Publicada</span>'}</a>`;
                }
                return `<button data-planned="true" type="button">${esc(topic.number)} ${esc(topic.title)}<span>Próximamente</span></button>`;
              }).join('')}
            </div>
          </section>`).join('')}
      </nav>
      <div class="sidebar-footer"><p>Estructura de cada tema</p><div class="topic-template">${(DATA.lessonTemplate || []).slice(0, 4).map((item) => `<span>${esc(item)}</span>`).join('')}</div></div>`;
  }

  function lessonBreadcrumbs(lesson) {
    const bits = [];
    if (lesson.unitLabel) bits.push(lesson.unitLabel);
    if (lesson.parentTitle) bits.push(lesson.parentTitle);
    bits.push(lesson.number ? `${lesson.number} ${lesson.title}` : lesson.title);
    return bits.map((bit) => esc(bit)).join(' <span>›</span> ');
  }

  function renderLessonPage(course, lesson) {
    const sidebar = document.getElementById('sidebar') || document.querySelector('[data-lesson-sidebar]');
    const topbar = document.querySelector('[data-lesson-topbar]') || document.querySelector('.topbar');
    const footer = document.querySelector('[data-lesson-footer]');
    if (sidebar) sidebar.innerHTML = lessonSidebar(course, lesson);
    if (topbar) {
      topbar.classList.add('topbar');
      topbar.innerHTML = `
        <button class="menu-button" id="menuButton" aria-label="Abrir temario">☰</button>
        <div class="breadcrumbs">${lessonBreadcrumbs(lesson)}</div>
        <button class="focus-button" id="focusButton" type="button">Modo presentación</button>`;
    }

    if (footer) {
      const list = course.lessons || [];
      const index = list.findIndex((item) => item.slug === lesson.slug);
      const prev = index > 0 ? list[index - 1] : null;
      const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;
      footer.innerHTML = `
        <footer class="lesson-footer">
          <div><span>${esc(SITE.name)}</span><strong>${esc(course.title)}${lesson.number ? ` · ${esc(lesson.number)}` : ''}</strong></div>
          <div class="footer-links">
            <a href="${esc(course.url)}">← Índice de la materia</a>
            ${prev ? `<a href="${esc(prev.url)}">← ${esc(prev.number || 'Anterior')}</a>` : ''}
            ${next ? `<a href="${esc(next.url)}">${esc(next.number || 'Siguiente')} →</a>` : ''}
            <a href="#lesson">Volver arriba ↑</a>
          </div>
        </footer>
        <div class="lesson-academic-footer">
          ${profileLinks(true)}
          <span>© ${esc(SITE.copyrightYear)} ${esc(SITE.owner)}</span>
        </div>`;
    }
  }

  function initialize() {
    renderSiteHeader();
    renderSiteFooter();
    renderHome();

    const ctx = currentContext();
    if (ctx.course && document.body.dataset.page === 'course') renderCoursePage(ctx.course);
    if (ctx.course && ctx.lesson && document.body.dataset.page === 'lesson') renderLessonPage(ctx.course, ctx.lesson);
  }

  initialize();
})();
