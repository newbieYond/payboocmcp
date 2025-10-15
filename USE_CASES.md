# PaybooCMCP 활용 가이드

이 API를 사용하여 구축할 수 있는 실제 프로젝트와 사용 사례를 소개합니다.

## 📋 목차

1. [기본 사용법](#기본-사용법)
2. [실제 활용 사례](#실제-활용-사례)
3. [프로젝트 아이디어](#프로젝트-아이디어)
4. [통합 예제](#통합-예제)

---

## 기본 사용법

### 1. 북마크 관리 시스템

CSV 파일에 북마크를 저장하고 API로 조회하세요.

**CSV 파일 만들기** (`data/my-bookmarks.csv`):
```csv
category,title,url,description
개발도구,GitHub,https://github.com,코드 저장소
문서,MDN,https://developer.mozilla.org,웹 개발 문서
학습,Coursera,https://coursera.org,온라인 강의
```

**API로 조회**:
```javascript
const response = await fetch('https://payboocmcp.vercel.app/api/extract-urls?filename=my-bookmarks.csv');
const data = await response.json();

// 카테고리별로 정리된 북마크
console.log(data.data.categorized);
// {
//   "개발도구": ["https://github.com"],
//   "문서": ["https://developer.mozilla.org"],
//   "학습": ["https://coursera.org"]
// }
```

### 2. 리소스 라이브러리

프로젝트별 참고 자료를 CSV로 관리하세요.

**CSV 파일** (`data/project-resources.csv`):
```csv
type,name,link,notes
Tutorial,React Docs,https://react.dev,공식 문서
Library,Tailwind CSS,https://tailwindcss.com,CSS 프레임워크
Tool,Vercel,https://vercel.com,배포 플랫폼
```

**Python으로 사용**:
```python
import requests

# 모든 리소스 가져오기
response = requests.get('https://payboocmcp.vercel.app/api/all-urls')
resources = response.json()

# 프로젝트 문서 자동 생성
for filename, data in resources['data'].items():
    print(f"\n## {filename}")
    for category, urls in data['categorized'].items():
        print(f"### {category}")
        for url in urls:
            print(f"- {url}")
```

---

## 실제 활용 사례

### 🎯 Case 1: 학습 자료 큐레이션 서비스

**시나리오**: 개발자들이 학습한 자료를 공유하는 플랫폼

**구현 방법**:

1. **CSV 파일 구조**:
```csv
category,title,url,difficulty,language
Frontend,React Tutorial,https://react.dev/learn,초급,한국어
Backend,Node.js Guide,https://nodejs.org/en/docs,중급,영어
DevOps,Docker Intro,https://docs.docker.com/get-started,초급,영어
```

2. **웹 앱 구현**:
```javascript
// 카테고리별 학습 자료 표시
async function displayResources() {
  const response = await fetch('https://payboocmcp.vercel.app/api/all-urls');
  const data = await response.json();

  for (const [file, content] of Object.entries(data.data)) {
    const section = document.createElement('section');
    section.innerHTML = `<h2>${file}</h2>`;

    for (const [category, urls] of Object.entries(content.categorized)) {
      section.innerHTML += `
        <h3>${category}</h3>
        <ul>
          ${urls.map(url => `<li><a href="${url}" target="_blank">${url}</a></li>`).join('')}
        </ul>
      `;
    }

    document.body.appendChild(section);
  }
}
```

3. **기능 확장**:
- 사용자별 학습 진도 추적
- 즐겨찾기 기능
- 검색 및 필터링
- 소셜 공유

---

### 🎯 Case 2: URL 모니터링 대시보드

**시나리오**: 여러 서비스의 URL 상태를 모니터링

**구현 방법**:

1. **CSV 파일**:
```csv
category,service,url,check_interval
Production,Main API,https://api.example.com/health,5분
Production,Website,https://example.com,10분
Staging,Test API,https://staging-api.example.com/health,15분
```

2. **모니터링 스크립트** (Node.js):
```javascript
const fetch = require('node-fetch');

async function monitorServices() {
  // API에서 URL 목록 가져오기
  const response = await fetch('https://payboocmcp.vercel.app/api/all-urls');
  const data = await response.json();

  // 각 URL 상태 확인
  for (const [file, content] of Object.entries(data.data)) {
    for (const url of content.urls) {
      try {
        const startTime = Date.now();
        const urlResponse = await fetch(url);
        const responseTime = Date.now() - startTime;

        console.log(`✅ ${url} - ${urlResponse.status} (${responseTime}ms)`);
      } catch (error) {
        console.log(`❌ ${url} - ERROR: ${error.message}`);
        // Slack/Discord 알림 전송
        await sendAlert(url, error.message);
      }
    }
  }
}

// 5분마다 실행
setInterval(monitorServices, 5 * 60 * 1000);
```

3. **추가 기능**:
- 응답 시간 그래프
- 다운타임 알림
- 히스토리 로그
- 대시보드 UI

---

### 🎯 Case 3: 콘텐츠 크롤러/스크래퍼

**시나리오**: 여러 뉴스 사이트에서 자동으로 콘텐츠 수집

**구현 방법**:

1. **CSV 파일** (`data/news-sources.csv`):
```csv
category,source,url,selector
Tech,TechCrunch,https://techcrunch.com,.post-title
Business,Bloomberg,https://bloomberg.com,.headline
Design,Dribbble,https://dribbble.com,.shot-title
```

2. **크롤러 구현** (Python + BeautifulSoup):
```python
import requests
from bs4 import BeautifulSoup

# API에서 크롤링 대상 URL 가져오기
response = requests.get('https://payboocmcp.vercel.app/api/extract-urls?filename=news-sources.csv')
sources = response.json()['data']

# 각 URL 크롤링
for category, urls in sources['categorized'].items():
    print(f"\n크롤링 중: {category}")

    for url in urls:
        try:
            page = requests.get(url)
            soup = BeautifulSoup(page.content, 'html.parser')

            # 콘텐츠 추출
            articles = soup.find_all('article')

            for article in articles[:5]:  # 상위 5개만
                title = article.find('h2').text
                link = article.find('a')['href']
                print(f"  - {title}: {link}")

        except Exception as e:
            print(f"  ❌ 에러: {url} - {e}")
```

---

### 🎯 Case 4: SEO 분석 도구

**시나리오**: 경쟁사 웹사이트 SEO 지표 분석

**구현 방법**:

1. **CSV 파일** (`data/competitors.csv`):
```csv
category,company,url,industry
직접경쟁사,CompanyA,https://companya.com,SaaS
직접경쟁사,CompanyB,https://companyb.com,SaaS
간접경쟁사,CompanyC,https://companyc.com,Platform
```

2. **SEO 분석 스크립트**:
```javascript
const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function analyzeSEO() {
  // 경쟁사 URL 가져오기
  const response = await fetch('https://payboocmcp.vercel.app/api/extract-urls?filename=competitors.csv');
  const data = await response.json();

  const results = [];

  for (const url of data.data.urls) {
    const page = await fetch(url);
    const html = await page.text();
    const $ = cheerio.load(html);

    // SEO 지표 추출
    const seoMetrics = {
      url: url,
      title: $('title').text(),
      description: $('meta[name="description"]').attr('content'),
      h1Count: $('h1').length,
      imageCount: $('img').length,
      linkCount: $('a').length,
      hasSchema: $('script[type="application/ld+json"]').length > 0
    };

    results.push(seoMetrics);
  }

  // 결과를 CSV 또는 대시보드로 출력
  console.table(results);
}
```

---

### 🎯 Case 5: 소셜 미디어 링크 관리

**시나리오**: 팀의 소셜 미디어 계정을 한 곳에서 관리

**구현 방법**:

1. **CSV 파일** (`data/social-media.csv`):
```csv
category,platform,url,team_member
공식계정,Twitter,https://twitter.com/company,마케팅팀
공식계정,LinkedIn,https://linkedin.com/company/company,HR팀
개인,GitHub,https://github.com/john,개발팀
개인,Medium,https://medium.com/@john,콘텐츠팀
```

2. **소셜 미디어 대시보드**:
```html
<!DOCTYPE html>
<html>
<head>
    <title>팀 소셜 미디어 대시보드</title>
    <style>
        .social-card {
            border: 1px solid #ddd;
            padding: 20px;
            margin: 10px;
            border-radius: 8px;
        }
        .category {
            color: #667eea;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>팀 소셜 미디어 링크</h1>
    <div id="links"></div>

    <script>
        async function loadSocialLinks() {
            const response = await fetch('https://payboocmcp.vercel.app/api/extract-urls?filename=social-media.csv');
            const data = await response.json();

            const container = document.getElementById('links');

            for (const [category, urls] of Object.entries(data.data.categorized)) {
                const section = document.createElement('div');
                section.innerHTML = `
                    <h2 class="category">${category}</h2>
                    ${urls.map(url => `
                        <div class="social-card">
                            <a href="${url}" target="_blank">${url}</a>
                        </div>
                    `).join('')}
                `;
                container.appendChild(section);
            }
        }

        loadSocialLinks();
    </script>
</body>
</html>
```

---

## 프로젝트 아이디어

### 💡 Idea 1: Chrome 확장 프로그램

**기능**: 현재 탭의 URL을 CSV 파일에 자동 저장

```javascript
// background.js
chrome.action.onClicked.addListener((tab) => {
  // API를 통해 URL 추가 (POST 엔드포인트 추가 필요)
  fetch('https://payboocmcp.vercel.app/api/add-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: tab.url,
      title: tab.title,
      category: '미분류'
    })
  });
});
```

### 💡 Idea 2: Slack Bot

**기능**: Slack에서 명령어로 URL 검색 및 추가

```javascript
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// /search-url 명령어
app.command('/search-url', async ({ command, ack, say }) => {
  await ack();

  const response = await fetch('https://payboocmcp.vercel.app/api/all-urls');
  const data = await response.json();

  const keyword = command.text;
  const results = [];

  for (const [file, content] of Object.entries(data.data)) {
    for (const url of content.urls) {
      if (url.includes(keyword)) {
        results.push(url);
      }
    }
  }

  await say(`검색 결과 (${results.length}개):\n${results.join('\n')}`);
});
```

### 💡 Idea 3: 자동화된 뉴스레터

**기능**: 매주 새로운 링크를 이메일로 전송

```javascript
const nodemailer = require('nodemailer');

async function sendWeeklyNewsletter() {
  // API에서 링크 가져오기
  const response = await fetch('https://payboocmcp.vercel.app/api/all-urls');
  const data = await response.json();

  // HTML 이메일 생성
  let emailBody = '<h1>이번 주의 추천 링크</h1>';

  for (const [file, content] of Object.entries(data.data)) {
    emailBody += `<h2>${file}</h2>`;

    for (const [category, urls] of Object.entries(content.categorized)) {
      emailBody += `<h3>${category}</h3><ul>`;
      urls.forEach(url => {
        emailBody += `<li><a href="${url}">${url}</a></li>`;
      });
      emailBody += '</ul>';
    }
  }

  // 이메일 전송
  const transporter = nodemailer.createTransport({ /* config */ });
  await transporter.sendMail({
    from: 'newsletter@example.com',
    to: 'subscribers@example.com',
    subject: '주간 링크 뉴스레터',
    html: emailBody
  });
}

// 매주 월요일 오전 9시 실행
// (cron job 또는 Vercel Cron 사용)
```

### 💡 Idea 4: 개인 지식 베이스

**기능**: Notion 스타일의 링크 관리 시스템

- 태그 시스템
- 검색 기능
- 즐겨찾기
- 읽음/안읽음 상태
- 메모 추가

### 💡 Idea 5: API 모니터링 서비스

**기능**: API 엔드포인트 상태 실시간 모니터링

- 응답 시간 측정
- 에러율 추적
- 알림 시스템
- 상태 페이지 생성

---

## 통합 예제

### 완전한 북마크 관리 앱

**기술 스택**: React + Tailwind CSS + PaybooCMCP API

```jsx
import React, { useState, useEffect } from 'react';

function BookmarkManager() {
  const [bookmarks, setBookmarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadBookmarks();
  }, []);

  async function loadBookmarks() {
    try {
      const response = await fetch('https://payboocmcp.vercel.app/api/all-urls');
      const data = await response.json();
      setBookmarks(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  }

  if (loading) {
    return <div className="text-center p-8">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">내 북마크</h1>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded ${selectedCategory === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          전체
        </button>
        {Object.keys(bookmarks).map(file => (
          <button
            key={file}
            onClick={() => setSelectedCategory(file)}
            className={`px-4 py-2 rounded ${selectedCategory === file ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {file.replace('.csv', '')}
          </button>
        ))}
      </div>

      {/* 북마크 리스트 */}
      {Object.entries(bookmarks).map(([file, content]) => {
        if (selectedCategory !== 'all' && selectedCategory !== file) return null;

        return (
          <div key={file} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{file}</h2>

            {Object.entries(content.categorized).map(([category, urls]) => (
              <div key={category} className="mb-6">
                <h3 className="text-xl text-gray-700 mb-2">{category}</h3>
                <div className="grid gap-3">
                  {urls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 bg-white border rounded-lg hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                        <span className="text-blue-600 hover:underline">{url}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <div className="mt-8 text-center text-gray-500">
        총 {Object.values(bookmarks).reduce((sum, content) => sum + content.total, 0)}개의 링크
      </div>
    </div>
  );
}

export default BookmarkManager;
```

---

## 고급 활용 팁

### 1. 캐싱으로 성능 향상

```javascript
// 로컬 스토리지 캐싱
async function getCachedBookmarks() {
  const cached = localStorage.getItem('bookmarks');
  const cacheTime = localStorage.getItem('bookmarks_time');

  // 10분 이내면 캐시 사용
  if (cached && Date.now() - cacheTime < 10 * 60 * 1000) {
    return JSON.parse(cached);
  }

  // 새로 가져오기
  const response = await fetch('https://payboocmcp.vercel.app/api/all-urls');
  const data = await response.json();

  localStorage.setItem('bookmarks', JSON.stringify(data));
  localStorage.setItem('bookmarks_time', Date.now());

  return data;
}
```

### 2. 에러 핸들링

```javascript
async function robustFetch(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. 검색 기능 추가

```javascript
function searchUrls(data, keyword) {
  const results = [];

  for (const [file, content] of Object.entries(data.data)) {
    for (const [category, urls] of Object.entries(content.categorized)) {
      const matching = urls.filter(url =>
        url.toLowerCase().includes(keyword.toLowerCase())
      );

      if (matching.length > 0) {
        results.push({
          file,
          category,
          urls: matching
        });
      }
    }
  }

  return results;
}
```

---

## 다음 단계

1. **CSV 파일 추가**: `data/` 디렉토리에 자신만의 CSV 파일 추가
2. **API 테스트**: Postman이나 cURL로 엔드포인트 테스트
3. **프로젝트 시작**: 위의 예제를 참고하여 실제 앱 구축
4. **기능 확장**: 필요한 API 엔드포인트 추가 요청

---

## 추가 리소스

- [GitHub Repository](https://github.com/newbieYond/payboocmcp)
- [API Documentation](https://payboocmcp.vercel.app/)
- [예제 코드](https://github.com/newbieYond/payboocmcp/tree/main/examples)

궁금한 점이 있으면 GitHub Issues에 문의하세요!
