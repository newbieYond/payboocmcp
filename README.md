# 페이북 정보 - 페이북 트래킹 링크 검색 MCP 서버

텍스트 검색으로 페이북 트래킹 링크를 찾는 MCP (Model Context Protocol) 서버입니다. Vercel에 배포되어 Claude Desktop에서 원격으로 사용할 수 있습니다.

## 🌐 이게 뭔가요?

**원격 MCP (Model Context Protocol) 서버**로:
- 페이북 트래킹 링크를 텍스트로 검색
- 캠페인, 콘텐츠, 키워드 등으로 필터링
- Claude Desktop에서 HTTPS로 작동
- Vercel에 호스팅 (로컬 서버 불필요)

## 🚀 빠른 시작

### 방법 1: 자동 설치 스크립트 (추천)

한 줄 명령어로 모든 설정을 자동으로 완료합니다:

```bash
curl -fsSL https://payboocmcp.vercel.app/install.sh | bash
```

**설치 완료 후:**
- Claude Desktop 재시작 (Cmd + Q, 재실행)
- "페이북 링크 찾아줘" 테스트

---

### 방법 2: 수동 설치

#### Claude Desktop 사용자

1. **저장소 클론**:
   ```bash
   git clone https://github.com/newbieYond/payboocmcp.git
   cd payboocmcp
   ```

2. **Claude Desktop 설정**:

   `~/Library/Application Support/Claude/claude_desktop_config.json` 편집:
   ```json
   {
     "mcpServers": {
       "페이북 정보": {
         "command": "node",
         "args": [
           "/절대/경로/payboocmcp/mcp-proxy.cjs"
         ]
       }
     }
   }
   ```

   `/절대/경로/payboocmcp`를 실제 경로로 변경하세요.

3. **다운로드 또는 설치**:

   **옵션 A - 원격 프록시 다운로드 (추천)**:
   ```bash
   mkdir -p ~/.paybooc-mcp
   curl -fsSL https://payboocmcp.vercel.app/mcp-proxy.cjs \
     -o ~/.paybooc-mcp/mcp-proxy.cjs
   ```

   그리고 설정에서 경로를 `~/.paybooc-mcp/mcp-proxy.cjs`로 변경

   **옵션 B - 로컬 프로젝트 사용**:
   위 설정 그대로 사용 (절대 경로 필요)

4. **Claude Desktop 재시작** (Cmd + Q, 재실행)

5. **테스트**:
   - Claude에게: **"페이북 링크 찾아줘"** (프롬프트 실행)
   - Claude에게: "페이북 링크 찾아줘: 카드" (키워드 포함)
   - Claude에게: "lotto 검색해줘"
   - Claude에게: "이벤트 링크 보여줘"

## 📋 주요 기능

- ✅ **원격 접근**: 인터넷만 있으면 어디서나 사용
- ✅ **로컬 서버 불필요**: Vercel 서버리스로 실행
- ✅ **프롬프트 지원**: **"페이북 링크 찾아줘"** 단축어 사용
- ✅ **MCP 도구**:
  - `search_links` ⭐ **텍스트로 트래킹 링크 검색**
- ✅ **자동 카테고리화**: 캠페인별 URL 정리
- ✅ **설정 불필요**: Claude Desktop에만 추가하면 됨

## 🗂️ 프로젝트 구조

```
payboocmcp/
├── api/
│   └── mcp-server.ts       # 원격 MCP 엔드포인트 (Vercel)
├── src/
│   ├── index.ts            # 로컬 MCP 서버 (선택)
│   └── csv-processor.ts    # CSV 파싱 로직
├── data/
│   └── links.csv           # 페이북 트래킹 링크 데이터
├── mcp-proxy.cjs           # HTTP-to-stdio 프록시
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

## 📝 CSV 파일 형식

### links.csv (트래킹 링크)

```csv
캠페인,광고 소재,콘텐츠,키워드,딥링크,트래킹 링크
바로카드 전용 혜택 페이지,-,-,-,ispmobile://...,https://link.paybooc.co.kr/...
카드 추가,-,-,-,ispmobile://...,https://link.paybooc.co.kr/...
```

모든 필드에서 검색이 가능합니다.

## 🔧 작동 방식

```
Claude Desktop (로컬)
    ↓ stdio
mcp-proxy.cjs (로컬 프록시)
    ↓ HTTPS
Vercel MCP Server (https://payboocmcp.vercel.app/api/mcp-server)
    ↓
links.csv 검색
    ↓
매칭된 트래킹 링크 반환
```

## 📖 사용 가능한 도구

### 🎯 프롬프트 (빠른 실행)

**find-paybooc-links** - 페이북 링크 빠른 검색

**Claude에서 사용**:
```
"페이북 링크 찾아줘"              ← 모든 링크 표시
"페이북 링크 찾아줘: 카드"         ← 키워드 검색
```

이 프롬프트는 자동으로 `search_links` 도구를 실행합니다.

### 1. search_links ⭐ 주요 기능

텍스트로 트래킹 링크를 검색합니다.

**Claude에서 사용**:
```
"페이북 링크 찾아줘"
"카드 관련 링크 찾아줘"
"lotto 검색해줘"
"이벤트 링크 보여줘"
"민생 관련된 거 찾아줘"
```

**응답 예시**:
```json
{
  "query": "카드",
  "matches": [
    {
      "campaign": "바로카드 전용 혜택 페이지",
      "adMaterial": "-",
      "content": "-",
      "keyword": "-",
      "deepLink": "ispmobile://ablink?link_target=id&page_id=P0622PG001W",
      "trackingLink": "https://link.paybooc.co.kr/barocard_member"
    }
  ],
  "total": 9
}
```

## 🛠️ 개발

### 로컬 개발

```bash
# 의존성 설치
npm install

# TypeScript 빌드
npm run build

# 로컬 MCP 서버 실행 (선택)
npm run dev
```

### 원격 MCP 테스트

```bash
# 검색 기능 테스트
node test-search.cjs

# 프록시 테스트
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp-proxy.cjs
```

### CSV 파일 추가하기

1. `data/` 디렉토리에 CSV 파일 추가
2. GitHub에 커밋 및 푸시
3. Vercel 자동 재배포
4. Claude Desktop에서 즉시 사용 가능

## 🌍 배포

이 프로젝트는 Vercel에 자동 배포됩니다:

- **MCP 엔드포인트**: https://payboocmcp.vercel.app/api/mcp-server
- **프로토콜**: JSON-RPC 2.0 over HTTPS
- **자동 배포**: `main` 브랜치에 푸시할 때마다

## 📚 문서

- **[REMOTE_MCP_SETUP.md](REMOTE_MCP_SETUP.md)** - 상세 설정 가이드 및 문제 해결

## 🔐 보안

- HTTPS 전용 (Vercel 자동 SSL)
- CORS 활성화
- 인증 없음 (공개 읽기 전용)
- CSV 파일은 버전 관리됨

## 🆚 원격 vs 로컬 MCP

| 기능 | 원격 MCP | 로컬 MCP |
|------|---------|---------|
| 설정 | 간단 (프록시만) | 복잡 (빌드 + 설정) |
| 접근성 | 어디서나 | 로컬만 |
| 속도 | ~100-500ms | ~10ms |
| 공유 | 쉬움 (같은 URL) | 어려움 (각각 설정) |
| 업데이트 | 자동 (Vercel) | 수동 재빌드 |

## 🤝 기여하기

1. 저장소 포크
2. `data/`에 CSV 파일 추가
3. Pull request 생성

## 📄 라이선스

MIT

## 🔗 링크

- **GitHub**: https://github.com/newbieYond/payboocmcp
- **원격 MCP 서버**: https://payboocmcp.vercel.app/api/mcp-server
- **MCP 명세**: https://spec.modelcontextprotocol.io/

---

**기술 스택**: TypeScript, Vercel, Model Context Protocol
**생성 도구**: Claude Code
**용도**: Claude Desktop과 함께 프로덕션 사용
