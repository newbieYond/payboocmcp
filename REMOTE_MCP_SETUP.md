# Remote MCP 서버 설정 가이드

Vercel에 배포된 PaybooCMCP를 Claude Desktop에서 Remote MCP 서버로 사용하는 방법입니다.

## 🌐 Remote vs Local MCP

### Local MCP (stdio)
- ✅ 로컬에서만 실행
- ✅ 빠른 응답 속도
- ❌ 다른 기기에서 사용 불가
- ❌ 서버 관리 필요

### Remote MCP (HTTP)
- ✅ 어디서나 접근 가능
- ✅ 여러 기기에서 공유
- ✅ 서버 관리 불필요 (Vercel)
- ⚠️ 네트워크 지연 가능

---

## 📡 Remote MCP 서버 설정

### 방법 1: npx를 사용한 HTTP 프록시

Claude Desktop은 기본적으로 stdio 전송만 지원하므로, HTTP-to-stdio 프록시가 필요합니다.

#### 1단계: 프록시 스크립트 생성

프로젝트 루트에 `mcp-proxy.js` 파일을 만듭니다:

```javascript
#!/usr/bin/env node

const https = require('https');
const readline = require('readline');

const MCP_SERVER_URL = 'https://payboocmcp.vercel.app/api/mcp-server';

// Read from stdin, send to remote server, write to stdout
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);

    const data = JSON.stringify(request);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(MCP_SERVER_URL, options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log(body);
      });
    });

    req.on('error', (error) => {
      console.error(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error.message
        }
      }));
    });

    req.write(data);
    req.end();
  } catch (error) {
    console.error(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error: ' + error.message
      }
    }));
  }
});

process.on('SIGINT', () => {
  process.exit(0);
});
```

#### 2단계: 스크립트 실행 가능하게 만들기

```bash
chmod +x mcp-proxy.js
```

#### 3단계: Claude Desktop 설정

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "payboocmcp-remote": {
      "command": "node",
      "args": [
        "/Users/bccard/Projects/payboocmcp/mcp-proxy.js"
      ]
    }
  }
}
```

---

### 방법 2: 직접 HTTP MCP 클라이언트 사용

더 나은 방법은 MCP HTTP 클라이언트를 만드는 것입니다.

#### 1단계: HTTP MCP 클라이언트 설치

```bash
npm install -g @modelcontextprotocol/cli
```

#### 2단계: Claude Desktop 설정

```json
{
  "mcpServers": {
    "payboocmcp-remote": {
      "command": "mcp-client",
      "args": [
        "https://payboocmcp.vercel.app/api/mcp-server"
      ]
    }
  }
}
```

---

### 방법 3: Cloudflare Workers + WebSocket (고급)

실시간 양방향 통신이 필요한 경우 WebSocket을 사용할 수 있습니다.

이 방법은 별도의 Cloudflare Workers 설정이 필요하며, 이 가이드의 범위를 벗어납니다.

---

## 🧪 테스트

### cURL로 직접 테스트

```bash
# Tools 목록 조회
curl -X POST https://payboocmcp.vercel.app/api/mcp-server \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'

# CSV 파일 목록 조회
curl -X POST https://payboocmcp.vercel.app/api/mcp-server \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "list_csv_files",
      "arguments": {}
    }
  }'

# URL 추출
curl -X POST https://payboocmcp.vercel.app/api/mcp-server \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_urls_from_csv",
      "arguments": {
        "filename": "example-links.csv"
      }
    }
  }'
```

### JavaScript로 테스트

```javascript
async function testRemoteMCP() {
  const response = await fetch('https://payboocmcp.vercel.app/api/mcp-server', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    })
  });

  const data = await response.json();
  console.log('Available tools:', data.result.tools);
}

testRemoteMCP();
```

---

## 🔧 문제 해결

### 문제 1: 프록시 스크립트가 작동하지 않음

**증상**: Claude Desktop에서 MCP 서버를 찾을 수 없음

**해결**:
1. 프록시 스크립트가 실행 가능한지 확인:
   ```bash
   chmod +x mcp-proxy.js
   node mcp-proxy.js  # 직접 테스트
   ```

2. Node.js 경로 확인:
   ```bash
   which node  # 정확한 node 경로 확인
   ```

3. Claude Desktop 설정에서 정확한 경로 사용:
   ```json
   {
     "command": "/usr/local/bin/node",
     "args": ["/absolute/path/to/mcp-proxy.js"]
   }
   ```

### 문제 2: CORS 에러

**해결**: 이미 API에 CORS 헤더가 설정되어 있으므로 문제없어야 합니다.

확인:
```bash
curl -I https://payboocmcp.vercel.app/api/mcp-server
```

`Access-Control-Allow-Origin: *` 헤더가 있어야 합니다.

### 문제 3: 느린 응답 속도

**원인**: Vercel serverless cold start

**해결**:
1. Vercel Pro 플랜 사용 (더 빠른 cold start)
2. 로컬 MCP 서버 사용 (방법 1 참고)
3. 캐싱 구현

---

## 🚀 배포 확인

### 1. Vercel 배포 확인

```bash
# 상태 확인
curl https://payboocmcp.vercel.app/api/mcp-server

# 예상 응답
{
  "error": "Method not allowed",
  "message": "This is an MCP server endpoint. Use POST with JSON-RPC 2.0 format."
}
```

### 2. MCP 프로토콜 테스트

```bash
curl -X POST https://payboocmcp.vercel.app/api/mcp-server \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

성공하면 사용 가능한 도구 목록이 반환됩니다.

---

## 📊 비교: Local vs Remote

| 특성 | Local MCP | Remote MCP |
|------|-----------|------------|
| 설정 복잡도 | 낮음 | 중간 |
| 응답 속도 | 빠름 (~10ms) | 중간 (~100-500ms) |
| 접근성 | 로컬만 | 어디서나 |
| 유지보수 | 수동 | 자동 (Vercel) |
| 비용 | 무료 | 무료 (Vercel Hobby) |
| 네트워크 필요 | 불필요 | 필요 |
| 보안 | 높음 (로컬) | 중간 (HTTPS) |

---

## 🔐 보안 고려사항

### Remote MCP 서버 보안

1. **인증 추가** (선택사항):
   ```typescript
   // api/mcp-server.ts에 추가
   const API_KEY = process.env.MCP_API_KEY;

   if (req.headers['x-api-key'] !== API_KEY) {
     return res.status(401).json({ error: 'Unauthorized' });
   }
   ```

2. **Rate Limiting**:
   Vercel은 자동으로 rate limiting을 제공합니다.

3. **HTTPS**:
   Vercel은 자동으로 HTTPS를 제공합니다.

---

## 📝 권장 사항

### 일반 사용자
👉 **Local MCP 사용** (방법 1)
- 더 빠르고 안정적
- 설정이 간단함

### 고급 사용자 / 팀
👉 **Remote MCP 사용** (방법 2)
- 여러 기기에서 공유
- 중앙 집중식 관리
- 자동 업데이트

### 엔터프라이즈
👉 **자체 서버 호스팅**
- 완전한 제어
- 커스텀 인증
- 전용 인프라

---

## 다음 단계

1. ✅ Remote MCP 서버 배포 (Vercel)
2. ✅ 프록시 스크립트 설정
3. ✅ Claude Desktop 설정
4. ✅ 테스트 및 검증
5. 🔄 필요시 인증/보안 추가

---

## 참고 자료

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Repository](https://github.com/newbieYond/payboocmcp)
