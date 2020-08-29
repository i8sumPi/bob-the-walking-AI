var canvas = el("canvas");
var ctx = canvas.getContext("2d");

const {Engine,Composite,Render,World,Bodies,Body,Detector,Constraint,Runner} = Matter;
var engine = Engine.create();
var runner = Runner.create();

var ground = Bodies.rectangle(600, 600, 1200, 100, {isStatic: true, collisionFilter: {
	category: 1
}});


var bobs = [];
var genNumber = 1;
var timePassed = 0;
var startLine = 150;
var numberBotsDead = 0;
var bestSpeed = 0;
var graphPosition = 0;
var creativity = 0.5;

class Bob{
	constructor(weights){
		var params = {
			collisionFilter: {
				category: 2,
				group: Body.nextGroup(false),
				mask: 1
			},
			friction: 1,
			frictionAir: 0,
			restitution: 0.5
		}

		var paramsForLeftLeg = JSON.parse(JSON.stringify(params));
		paramsForLeftLeg.collisionFilter.group = Body.nextGroup(false);

		var paramsForArm = JSON.parse(JSON.stringify(params));
		paramsForArm.collisionFilter.group = Body.nextGroup(false);

		this.weights = weights;

		this.place = -1;

		this.rightThigh = Bodies.rectangle(startLine+15, 470, 20, 40, params);//470-510
		this.leftThigh = Bodies.rectangle(startLine-15, 470, 20, 40, paramsForLeftLeg);//470-510
		this.rightShin = Bodies.rectangle(startLine+15, 500, 20, 40, params);//510-550
		this.leftShin = Bodies.rectangle(startLine-15, 500, 20, 40, paramsForLeftLeg);//510-550
		this.torso = Bodies.rectangle(startLine, 420, 20, 40, params);//410-470
		this.arm = Bodies.rectangle(startLine, 420, 20, 40, paramsForArm);
		this.head = Bodies.circle(startLine, 390, 10, params);

		this.leftTorsoToLeg = makeConnector(this.leftThigh, this.torso, 0,-15, 0,15);
		this.rightTorsoToLeg = makeConnector(this.rightThigh, this.torso, 0,-15, 0,15);
		this.rightKnee = makeConnector(this.rightShin, this.rightThigh, 0,-15, 0,15);
		this.leftKnee = makeConnector(this.leftShin, this.leftThigh, 0,-15, 0,15);
		this.sholder = makeConnector(this.arm, this.torso, 0,-15, 0,-10);

		this.neck = makeConnector(this.head, this.torso, 0,0, 0,-30);
		this.world = World.add(engine.world, [
			ground,
			...this.getAllParts()
		]);
		bobs.push(this);
	}
	getAllParts(){
		return [
			this.rightThigh, 
			this.leftThigh, 
			this.rightShin, 
			this.leftShin, 
			this.torso, 
			this.head, 
			this.arm, 

			this.leftTorsoToLeg, 
			this.rightKnee, 
			this.leftKnee, 
			this.rightTorsoToLeg, 
			this.sholder,
			this.neck
		]
	}
	draw(col){
		appearRect(this.leftThigh.vertices, col);
		appearRect(this.leftShin.vertices, col);

		appearRect(this.rightThigh.vertices, col);
		appearRect(this.rightShin.vertices, col);

		appearRect(this.torso.vertices, col);
		appearCirc(this.head, col);
		appearRect(this.arm.vertices, col);
	}
	move(speed){
		Body.translate(this.rightThigh, {x:-speed, y:0});
		Body.translate(this.leftThigh, {x:-speed, y:0});
		Body.translate(this.rightShin, {x:-speed, y:0});
		Body.translate(this.leftShin, {x:-speed, y:0});
		Body.translate(this.torso, {x:-speed, y:0});
		Body.translate(this.arm, {x:-speed, y:0});
		Body.translate(this.head, {x:-speed, y:0});
	}
}

function makeConnector(bodyA, bodyB, aX, aY, bX, bY){
	return Constraint.create({
		bodyA: bodyA,
		bodyB: bodyB,
		pointA: {x: aX, y: aY},
		pointB: {x: bX, y: bY},
		stiffness: 1,
		length: 0,
		damping: 0.1
	})
}

function start(){
	el("generation").innerHTML = "Generation 1";
	drawAll();
}

function endGeneration(speed){
	var showSp = el("showSpeed").getContext("2d");
	showSp.fillRect(graphPosition, 100-speed*33, 1,1);
	graphPosition++;

	console.log(speed);
	genNumber ++;
	el("generation").innerHTML = "Generation: "+genNumber+", Speed: "+(speed);
	timePassed = 0;
	startLine = 150;
	numberBotsDead = 0;

	World.clear(engine.world);
	Engine.clear(engine);
	newGeneration();
}

function drawAll(){
	timePassed ++;
	startLine -= bestSpeed;
	var shouldDisplay = el("watch").checked || timePassed % 10 == 0

	Matter.Runner.tick(runner, engine, 30)

	if(shouldDisplay){
		ctx.clearRect(0,0,800,600);
		ctx.fillStyle = "grey";
		ctx.fillRect(startLine,0,3,600);
		for (var i = 0; i < 10; i++) {
			ctx.fillRect(startLine%80 + i*80,0,1,600);
		}
		ctx.fillStyle = "red"
		//ctx.fillRect(10,0,3,600);
		ctx.fillRect(0,480,800,1);
		appearRect(ground.vertices,"green");
	}

	bobs.forEach((item,index) =>{
		item.move(bestSpeed);
		if(timePassed % 5 == 1){
			moveBob(item); 
		}

		if(item.place == -1){
			if(index == bobs.length-1 && shouldDisplay){
				item.draw("rgba(255,255,255, 1)");
			}else if(shouldDisplay){
				item.draw("hsla("+index*360/bobs.length+", 100%, 70%, 30%)");
			}

			if(item.head.bounds.max.y > 480 || item.torso.bounds.max.y > 550 || timePassed > 100){
				//kill a robot
				Body.setStatic(item.rightThigh, true); 
				Body.setStatic(item.leftThigh, true); 
				Body.setStatic(item.rightShin, true); 
				Body.setStatic(item.leftShin, true); 
				Body.setStatic(item.torso, true); 
				Body.setStatic(item.arm, true); 
				Body.setStatic(item.head, true); 

				//item.place = numberBotsDead;
				item.place = closestPos(item);

				numberBotsDead++;
				if(numberBotsDead == bobs.length){
					//bestSpeed = Math.max((closestPos(item) - startLine)/timePassed+0.2, 3);
					var bestItem = bobs[bobs.length-1];
					var speed = (closestPos(bestItem) - startLine)/timePassed * 6/5280/80 * 12000;
					endGeneration(speed);
				}
			}
		}
	});

	if(!el("watch") || el("watch").checked){
		setTimeout(drawAll, 30);
	}else{
		setTimeout(drawAll,1);
	}
}

function appearRect(verts,col){
	ctx.fillStyle = col;
	ctx.beginPath();
	ctx.moveTo(verts[0].x, verts[0].y)
	for (var i = 1; i < verts.length; i++) {
		ctx.lineTo(verts[i].x, verts[i].y);
	}
	ctx.lineTo(verts[0].x, verts[0].y);
	ctx.fill();
	ctx.stroke();
}
function appearCirc(toDraw, col){
	ctx.fillStyle = col;
	ctx.beginPath();
	ctx.arc(toDraw.position.x, toDraw.position.y, toDraw.circleRadius, 0, 2*Math.PI)
	ctx.fill();
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(toDraw.position.x+3, toDraw.position.y,toDraw.circleRadius/3,0,Math.PI,false); 
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(toDraw.position.x, toDraw.position.y-3,0.5,0,Math.PI*2,false); 
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(toDraw.position.x+6, toDraw.position.y-3,0.5,0,Math.PI*2,false); 
	ctx.stroke();
}

function el(id){ return document.getElementById(id)};