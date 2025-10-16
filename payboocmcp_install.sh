#!/bin/bash

# Paybooc MCP 자동 설치 스크립트
# 사용법: curl -fsSL https://raw.githubusercontent.com/newbieYond/payboocmcp/main/payboocmcp_install.sh | bash

set -e  # 에러 발생 시 스크립트 중단

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 에러 핸들러
handle_error() {
    log_error "설치 중 오류가 발생했습니다."
    log_error "오류 위치: $1"
    echo ""
    echo "문제 해결 방법:"
    echo "1. 인터넷 연결을 확인하세요"
    echo "2. 관리자 권한이 필요할 수 있습니다 (sudo)"
    echo "3. 수동 설치 가이드: https://github.com/paybooc/mcp-server"
    echo "4. 문의: support@paybooc.com"
    exit 1
}

trap 'handle_error $LINENO' ERR

# OS 감지
detect_os() {
    log_info "운영체제 감지 중..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        CONFIG_DIR="$HOME/Library/Application Support/Claude"
        log_success "macOS 감지됨"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        CONFIG_DIR="$HOME/.config/Claude"
        log_success "Linux 감지됨"
    else
        log_error "지원하지 않는 운영체제입니다: $OSTYPE"
        log_error "macOS 또는 Linux만 지원됩니다."
        exit 1
    fi
}

# Node.js 설치 확인
check_nodejs() {
    log_info "Node.js 설치 확인 중..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log_success "Node.js가 이미 설치되어 있습니다: $NODE_VERSION"
        return 0
    else
        log_warning "Node.js가 설치되어 있지 않습니다."
        return 1
    fi
}

# Node.js 설치 (macOS)
install_nodejs_macos() {
    log_info "macOS용 Node.js 설치 시작..."
    
    # Homebrew 확인
    if ! command -v brew &> /dev/null; then
        log_info "Homebrew 설치 중..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || {
            log_error "Homebrew 설치 실패"
            log_error "수동 설치: https://brew.sh"
            return 1
        }
        
        # Homebrew PATH 추가
        if [[ $(uname -m) == 'arm64' ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        else
            eval "$(/usr/local/bin/brew shellenv)"
        fi
        
        log_success "Homebrew 설치 완료"
    fi
    
    # Node.js 설치
    log_info "Node.js 설치 중... (1-2분 소요될 수 있습니다)"
    brew install node || {
        log_error "Node.js 설치 실패"
        log_error "다음 명령어로 수동 설치해주세요:"
        log_error "  brew install node"
        return 1
    }
    
    # 설치 확인
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log_success "Node.js 설치 완료: $NODE_VERSION"
        return 0
    else
        log_error "Node.js 설치는 완료되었으나 실행할 수 없습니다."
        log_error "터미널을 재시작한 후 다시 시도해주세요."
        return 1
    fi
}

# Node.js 설치 (Linux)
install_nodejs_linux() {
    log_info "Linux용 Node.js 설치 시작..."
    
    # NodeSource 저장소 추가
    log_info "NodeSource 저장소 설정 중..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - || {
        log_error "NodeSource 저장소 설정 실패"
        log_error "다음 명령어로 수동 설치해주세요:"
        log_error "  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
        log_error "  sudo apt-get install -y nodejs"
        return 1
    }
    
    # Node.js 설치
    log_info "Node.js 설치 중... (1-2분 소요될 수 있습니다)"
    sudo apt-get install -y nodejs || {
        log_error "Node.js 설치 실패"
        log_error "패키지 관리자를 업데이트한 후 다시 시도해주세요:"
        log_error "  sudo apt-get update"
        log_error "  sudo apt-get install -y nodejs"
        return 1
    }
    
    # 설치 확인
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        log_success "Node.js 설치 완료: $NODE_VERSION"
        return 0
    else
        log_error "Node.js 설치는 완료되었으나 실행할 수 없습니다."
        log_error "터미널을 재시작한 후 다시 시도해주세요."
        return 1
    fi
}

# Claude Desktop 설치 확인
check_claude_desktop() {
    log_info "Claude Desktop 설치 확인 중..."
    
    if [[ "$OS" == "macos" ]]; then
        if [[ -d "/Applications/Claude.app" ]]; then
            log_success "Claude Desktop이 설치되어 있습니다."
            return 0
        fi
    elif [[ "$OS" == "linux" ]]; then
        if command -v claude &> /dev/null; then
            log_success "Claude Desktop이 설치되어 있습니다."
            return 0
        fi
    fi
    
    log_warning "Claude Desktop이 설치되어 있지 않습니다."
    log_warning "다음 링크에서 Claude Desktop을 먼저 설치해주세요:"
    log_warning "  https://claude.ai/download"
    
    read -p "Claude Desktop을 이미 설치했다면 Enter를 눌러 계속 진행하세요... " -r
    return 0
}

# MCP 프록시 다운로드
download_mcp_proxy() {
    log_info "MCP 프록시 스크립트 다운로드 중..."

    INSTALL_DIR="$HOME/.paybooc-mcp"
    mkdir -p "$INSTALL_DIR" || {
        log_error "설치 디렉토리 생성 실패: $INSTALL_DIR"
        return 1
    }

    PROXY_FILE="$INSTALL_DIR/mcp-proxy.cjs"

    # GitHub에서 mcp-proxy.cjs 다운로드
    curl -fsSL "https://raw.githubusercontent.com/newbieYond/payboocmcp/main/mcp-proxy.cjs" -o "$PROXY_FILE" || {
        log_error "프록시 스크립트 다운로드 실패"
        log_error "URL: https://raw.githubusercontent.com/newbieYond/payboocmcp/main/mcp-proxy.cjs"
        return 1
    }

    # 실행 권한 부여
    chmod +x "$PROXY_FILE" || {
        log_warning "실행 권한 설정 실패 (계속 진행합니다)"
    }

    log_success "프록시 스크립트 다운로드 완료: $PROXY_FILE"
    return 0
}

# MCP 설정 파일 생성/업데이트
configure_mcp() {
    log_info "MCP 설정 파일 구성 중..."

    # 디렉토리 생성
    mkdir -p "$CONFIG_DIR" || {
        log_error "설정 디렉토리 생성 실패: $CONFIG_DIR"
        log_error "다음 명령어로 수동 생성해주세요:"
        log_error "  mkdir -p \"$CONFIG_DIR\""
        return 1
    }

    CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
    PROXY_FILE="$HOME/.paybooc-mcp/mcp-proxy.cjs"

    # 기존 설정 파일 백업
    if [[ -f "$CONFIG_FILE" ]]; then
        BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
        log_info "기존 설정 파일 백업 중: $BACKUP_FILE"
        cp "$CONFIG_FILE" "$BACKUP_FILE" || {
            log_warning "백업 실패. 계속 진행합니다..."
        }
    fi

    # 설정 파일 생성/업데이트
    if [[ -f "$CONFIG_FILE" ]]; then
        log_info "기존 설정 파일에 링크찾기 MCP 추가 중..."

        # JSON 파싱 및 병합 (jq 사용)
        if command -v jq &> /dev/null; then
            # jq로 안전하게 병합
            TMP_FILE=$(mktemp)
            jq --arg proxy "$PROXY_FILE" '.mcpServers["링크찾기"] = {
                "command": "node",
                "args": [$proxy]
            }' "$CONFIG_FILE" > "$TMP_FILE" || {
                log_error "설정 파일 업데이트 실패 (JSON 파싱 오류)"
                log_error "기존 설정 파일에 문법 오류가 있을 수 있습니다."
                log_error "다음 사이트에서 JSON 검증: https://jsonlint.com"
                rm -f "$TMP_FILE"
                return 1
            }
            mv "$TMP_FILE" "$CONFIG_FILE"
        else
            # jq 없으면 수동으로 안내
            log_warning "jq가 설치되어 있지 않아 자동 설정을 건너뜁니다."
            log_warning "다음 내용을 수동으로 추가해주세요:"
            echo ""
            cat << EOF
{
  "mcpServers": {
    "링크찾기": {
      "command": "node",
      "args": ["$PROXY_FILE"]
    }
  }
}
EOF
            echo ""
            log_warning "설정 파일 위치: $CONFIG_FILE"
            return 1
        fi
    else
        log_info "새 설정 파일 생성 중..."
        cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "링크찾기": {
      "command": "node",
      "args": ["$PROXY_FILE"]
    }
  }
}
EOF

        if [[ ! -f "$CONFIG_FILE" ]]; then
            log_error "설정 파일 생성 실패: $CONFIG_FILE"
            return 1
        fi
    fi

    log_success "MCP 설정 완료: $CONFIG_FILE"
    return 0
}

# jq 설치 (선택)
install_jq() {
    if command -v jq &> /dev/null; then
        return 0
    fi
    
    log_info "JSON 처리 도구(jq) 설치 중..."
    
    if [[ "$OS" == "macos" ]]; then
        brew install jq &> /dev/null || {
            log_warning "jq 설치 실패 (계속 진행합니다)"
            return 1
        }
    elif [[ "$OS" == "linux" ]]; then
        sudo apt-get install -y jq &> /dev/null || {
            log_warning "jq 설치 실패 (계속 진행합니다)"
            return 1
        }
    fi
    
    log_success "jq 설치 완료"
    return 0
}

# 설치 검증
verify_installation() {
    log_info "설치 검증 중..."
    
    # Node.js 확인
    if ! command -v node &> /dev/null; then
        log_error "Node.js가 PATH에 없습니다."
        log_error "터미널을 재시작한 후 다시 확인해주세요."
        return 1
    fi
    
    # npx 확인
    if ! command -v npx &> /dev/null; then
        log_error "npx가 PATH에 없습니다."
        log_error "Node.js가 제대로 설치되지 않았을 수 있습니다."
        return 1
    fi
    
    # 설정 파일 확인
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_error "설정 파일이 생성되지 않았습니다."
        return 1
    fi
    
    # JSON 유효성 검사
    if command -v jq &> /dev/null; then
        if ! jq empty "$CONFIG_FILE" 2>/dev/null; then
            log_error "설정 파일의 JSON 형식이 올바르지 않습니다."
            log_error "다음 사이트에서 검증: https://jsonlint.com"
            log_error "파일 위치: $CONFIG_FILE"
            return 1
        fi
    fi
    
    log_success "모든 검증 완료!"
    return 0
}

# 최종 안내
show_completion_message() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "🎉 Paybooc MCP 설치가 완료되었습니다!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 다음 단계:"
    echo ""
    echo "1. Claude Desktop을 재시작하세요"
    if [[ "$OS" == "macos" ]]; then
        echo "   - Cmd+Q로 완전히 종료 후 다시 실행"
    else
        echo "   - 앱을 완전히 종료 후 다시 실행"
    fi
    echo ""
    echo "2. Claude에게 다음과 같이 물어보세요:"
    echo "   \"페이북 링크 찾아줘\""
    echo "   \"페이북 링크 찾아줘: 카드\""
    echo ""
    echo "3. 사용 가능한 도구 확인:"
    echo "   \"사용 가능한 MCP 도구가 뭐야?\""
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📚 추가 정보:"
    echo "   - GitHub: https://github.com/newbieYond/payboocmcp"
    echo "   - 설정 위치: $CONFIG_FILE"
    echo ""
    
    if [[ -n "$BACKUP_FILE" && -f "$BACKUP_FILE" ]]; then
        echo "💾 백업 파일: $BACKUP_FILE"
        echo ""
    fi
}

# 메인 실행 함수
main() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "   Paybooc MCP 자동 설치 스크립트"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # OS 감지
    detect_os
    echo ""
    
    # Claude Desktop 확인
    check_claude_desktop
    echo ""
    
    # Node.js 확인 및 설치
    if ! check_nodejs; then
        echo ""
        log_info "Node.js 설치를 시작합니다..."
        log_info "관리자 권한(sudo)이 필요할 수 있습니다."
        echo ""
        
        if [[ "$OS" == "macos" ]]; then
            install_nodejs_macos || handle_error "Node.js 설치 실패"
        elif [[ "$OS" == "linux" ]]; then
            install_nodejs_linux || handle_error "Node.js 설치 실패"
        fi
    fi
    echo ""
    
    # jq 설치 (선택)
    install_jq
    echo ""

    # MCP 프록시 다운로드
    download_mcp_proxy || handle_error "MCP 프록시 다운로드 실패"
    echo ""

    # MCP 설정
    configure_mcp || {
        log_error "MCP 설정 실패"
        log_error "수동 설정이 필요합니다."
        echo ""
        echo "다음 내용을 복사하여 설정 파일에 추가하세요:"
        echo "파일 위치: $CONFIG_FILE"
        echo ""
        cat << EOF
{
  "mcpServers": {
    "링크찾기": {
      "command": "node",
      "args": ["$HOME/.paybooc-mcp/mcp-proxy.cjs"]
    }
  }
}
EOF
        exit 1
    }
    echo ""
    
    # 검증
    verify_installation || {
        log_error "설치 검증 실패"
        log_error "수동으로 설정을 확인해주세요."
        exit 1
    }
    echo ""
    
    # 완료 메시지
    show_completion_message
}

# 스크립트 실행
main