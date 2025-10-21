let colors = ['#f71735', '#067bc2', '#FFC247', '#3BD89F', '#81cfe5', '#f654a9'];
let shapes = [];
let objs = [];
let ctx;
// 新增：檢視模式與選單狀態（0: 原始, 1: 反轉, 2: 反轉+調灰）
let viewMode = 0;
let menuVisible = false;
let menuX = 10, menuY = 10, menuW = 160;
let optionH = 40;
// 新增：選單底部額外間距，避免選項超出框
let menuExtraPadding = 30;
// 新增：第一週筆記網址
let hwURL = 'https://hackmd.io/@HH25BnHCRRaH9bobDmRjtQ/HJ0WY_1neg';
// 新增：第一週作業網址（選項三）
let hw2URL = 'https://7moonowo-cmyk.github.io/20251014_2/';

function setup() {
    // 建立全螢幕畫布
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.position(0, 0);
    cnv.style('display', 'block');
    rectMode(CENTER);
    ctx = drawingContext;
    initialize();
}

// 當視窗大小改變時調整畫布並重新初始化物件
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    initialize();
}

function draw() {
    // 先套用畫面濾鏡到主要畫面（選單會在後面繪製，且不受濾鏡影響）
    if (drawingContext) {
        if (viewMode === 0) drawingContext.filter = 'none';
        else if (viewMode === 1) drawingContext.filter = 'invert(100%)';
        else if (viewMode === 2) drawingContext.filter = 'invert(100%) grayscale(100%)';
    }

    background('#121220');
    for (let o of objs) {
        o.run();
    }

    if (frameCount % 400 == 0) {
        initialize();
    }

    // 重設濾鏡，確保選單不被影響
    if (drawingContext) drawingContext.filter = 'none';

    // 顯示選單條件：滑鼠移到左上角啟動區或滑鼠在選單區域內都顯示選單
    let activationArea = (mouseX >= 0 && mouseY >= 0 && mouseX < 80 && mouseY < 80);
    // 使用 menuExtraPadding 計算高度
    let menuH = optionH * 3 + 10 + menuExtraPadding;
    let insideMenuArea = (mouseX >= menuX && mouseX <= menuX + menuW && mouseY >= menuY && mouseY <= menuY + menuH);
    menuVisible = activationArea || insideMenuArea;

    if (menuVisible) {
        drawMenu();
    }
}

function checkRectCollision(a, b) {
	return (
		a.x - a.w / 2 < b.x + b.w / 2 &&
		a.x + a.w / 2 > b.x - b.w / 2 &&
		a.y - a.h / 2 < b.y + b.h / 2 &&
		a.y + a.h / 2 > b.y - b.h / 2
	);
}

function checkCircleCollision(a, b) {
	let distSq = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
	let radiusSum = (a.w / 2) + (b.w / 2);
	return distSq < radiusSum ** 2;
}

function checkCircleRectCollision(circle, rect) {
	let nearestX = constrain(circle.x, rect.x - rect.w / 2, rect.x + rect.w / 2);
	let nearestY = constrain(circle.y, rect.y - rect.h / 2, rect.y + rect.h / 2);
	let distSq = (circle.x - nearestX) ** 2 + (circle.y - nearestY) ** 2;
	return distSq < (circle.w / 2) ** 2;
}

function checkCollision(a, b) {
	if (a.t == 0 && b.t == 0) return checkRectCollision(a, b);
	if (a.t == 1 && b.t == 1) return checkCircleCollision(a, b);
	return a.t == 0
		? checkCircleRectCollision(b, a)
		: checkCircleRectCollision(a, b);
}

function easeInOutCubic(x) {
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function initialize() {
	shapes = [];
	objs = [];
	let n = 15;
	for (let i = 0; i < 10000; i++) {
		let x = (width / n) * int(random((n + 1)));
		let y = (height / n) * int(random((n + 1)));
		let w = (width / (n + 2)) * int(random(3) + 1);
		let h = (width / (n + 2)) * int(random(3) + 1);
		let clr = random(colors)
		if (random() < .5) {
			let tmp = w;
			w = h;
			h = tmp
		}
		let type = int(random(2));
		let newShape = { x, y, w: w, h: h, t: type, clr: clr };
		let overlap = false;
		for (let s of shapes) {
			if (checkCollision(newShape, s)) {
				overlap = true;
				break;
			}
		}
		if (!overlap) shapes.push(newShape);
	}

	for (let s of shapes) {
		objs.push(new OneStroke(s.x, s.y, s.w - width * 0.01, s.h - width * 0.01, s.t, s.clr));
	}
}

class OneStroke {
	constructor(x, y, w, h, type, clr) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.t = -int(random(150));
		this.t1 = 40;
		this.t2 = this.t1 + 150;
		this.t3 = this.t2 + 40;
		this.type = type;
		this.clr = clr;
		this.circumference = PI * this.w;
		if (this.type == 0) {
			this.circumference = (this.w + this.h) * 2;
		}
		this.amount = 0;
		this.vr = random([-1, 1]);
		this.hr = random([-1, 1]);
	}

	show() {
		push();
		translate(this.x, this.y);
		scale(this.vr, this.hr);
		ctx.setLineDash([this.circumference, this.circumference]);
		ctx.lineDashOffset = this.circumference + (this.circumference * this.amount);
		noFill();
		stroke(this.clr);
		strokeWeight(width * 0.01);
		if (this.type == 0) {
			rect(0, 0, this.w, this.h, width * 0.005);
		} else if (this.type == 1) {
			circle(0, 0, this.w);
		}
		pop();

	}

	move() {
		this.t++;
		if (0 < this.t && this.t < this.t1) {
			let n = norm(this.t, 0, this.t1 - 1);
			this.amount = easeInOutCubic(n);
		} else if (this.t2 < this.t && this.t < this.t3) {
			let n = norm(this.t, this.t2, this.t3 - 1);
			this.amount = easeInOutCubic(1 - n);
		}
	}

	run() {
		this.show();
		this.move();
	}
}

// 新增：繪製左上角選單
function drawMenu() {
    push();
    rectMode(CORNER);
    translate(menuX, menuY);

    // 使用 menuExtraPadding 計算高度
    let menuH = optionH * 3 + 10 + menuExtraPadding;
    // 背景
    noStroke();
    fill(30, 220);
    rect(0, 0, menuW, menuH, 8);

    // 標題
    fill(255);
    textSize(14);
    textAlign(LEFT, TOP);
    text('檢視選單', 10, 6);

    // 選項文字
    let labels = ['選項一', '第一週筆記', '第一週作業'];

    for (let i = 0; i < 3; i++) {
        let y = 30 + i * optionH;
        // 背景（hover 或 已選）
        if (viewMode === i) {
            fill(255, 100);
        } else if (mouseX >= menuX && mouseX <= menuX + menuW && mouseY >= menuY + y && mouseY <= menuY + y + optionH) {
            fill(255, 30);
            cursor(HAND);
        } else {
            fill(255, 10);
            // 若沒有在選單上，恢復預設游標
            if (!(mouseX >= menuX && mouseX <= menuX + menuW && mouseY >= menuY && mouseY <= menuY + menuH)) cursor(ARROW);
        }
        rect(8, y, menuW - 16, optionH - 6, 6);

        // 文字
        fill(20);
        textSize(12);
        textAlign(LEFT, CENTER);
        fill(255);
        text(labels[i], 16, y + (optionH - 6) / 2);
    }

    pop();
}

// 新增：點擊選單切換檢視模式（修正為同時檢查 x 與 y 範圍）
function mousePressed() {
    if (menuVisible) {
        // 使用 menuExtraPadding 計算高度
        let menuH = optionH * 3 + 10 + menuExtraPadding;
        if (mouseX >= menuX && mouseX <= menuX + menuW && mouseY >= menuY && mouseY <= menuY + menuH) {
            let localY = mouseY - menuY - 30; // 30 是標題與間隔
            let idx = floor(localY / optionH);
            if (idx >= 0 && idx < 3) {
                if (idx === 1) {
                    // 選項二：開啟第一週筆記網址（新分頁）
                    window.open(hwURL, '_blank');
                } else if (idx === 2) {
                    // 選項三：開啟第一週作業網址（新分頁）
                    window.open(hw2URL, '_blank');
                } else {       }
                    // 選項一：切換檢視模式為原始（index 0）       }
                    viewMode = idx;       }
                }    }
            }






