const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const toggleWebcamButton = document.getElementById('toggleWebcam');
const clearCanvasButton = document.getElementById('clearCanvas');

let handposeModel;
let points = []; // 점을 저장할 배열
let isDrawing = true; // 점 그리기 활성화 상태
let isWebcamOn = true; // 웹캠 상태

// 웹캠 시작
async function startWebcam() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
}

// 웹캠 권한 요청 및 초기화
async function init() {
    await startWebcam();
    handposeModel = await handpose.load();
    detectHands();
}

// 손을 감지하고 점을 그리는 함수
async function detectHands() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const predictions = await handposeModel.estimateHands(video);

    if (predictions.length > 0) {
        const indexFinger = predictions[0].annotations.indexFinger[3]; // 검지 손가락 끝 좌표
        const palmBase = predictions[0].annotations.palmBase[0]; // 손바닥 중심 좌표

        const distanceFingerToPalm = distance(indexFinger, palmBase);

        // 주먹 상태 확인: 손바닥과 검지 사이의 거리가 짧으면 주먹 상태로 간주
        if (distanceFingerToPalm < 50) {
            isDrawing = false; // 주먹을 쥐었을 때 그리기 중지
        } else {
            isDrawing = true; // 손을 폈을 때 그리기 활성화
        }

        if (isDrawing) {
            points.push(indexFinger); // 점 추가
        }
    }

    drawPoints(); // 점 그리기

    requestAnimationFrame(detectHands); // 계속 감지
}

// 점 그리기
function drawPoints() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스 초기화
    ctx.fillStyle = 'white';
    ctx.lineWidth = 3; // 점 크기를 조정
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point[0], point[1], 5, 0, 2 * Math.PI); // 점 크기
        ctx.fill();
    });
}

// 두 점 사이 거리 계산
function distance(p1, p2) {
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
}

// 웹캠 켜기/끄기 버튼 클릭 이벤트
toggleWebcamButton.addEventListener('click', () => {
    if (isWebcamOn) {
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop()); // 모든 트랙 중지
        video.srcObject = null; // 비디오 소스 해제
        toggleWebcamButton.textContent = '웹캠 켜기'; // 버튼 텍스트 변경
        isWebcamOn = false;
    } else {
        startWebcam(); // 웹캠 시작
        toggleWebcamButton.textContent = '웹캠 끄기'; // 버튼 텍스트 변경
        isWebcamOn = true;
    }
});

// 캔버스 클리어 버튼 클릭 이벤트
clearCanvasButton.addEventListener('click', () => {
    points = []; // 점 배열 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스 초기화
});

// 페이지 로드 시 초기화
init();
