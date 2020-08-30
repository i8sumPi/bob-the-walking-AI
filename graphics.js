var canvas = el("canvas"); //el is same as document.getElementById(), see the last line.
var ctx = canvas.getContext("2d");

//set up matter.js
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
var graphPosition = 0;
var creativity = 0.5;


// a bob is the class for one of the robots that are currently racing
class Bob{
	constructor(weights){
		var params = {
			//make them not intersect
			collisionFilter: {
				category: 2,
				group: Body.nextGroup(false),
				mask: 1
			},
			friction: 1,
			frictionAir: 0,
			restitution: 0.5 //bouncy
		}

		var paramsForLeftLeg = JSON.parse(JSON.stringify(params)); // so when I change paramsForLeftLeg, I don't change params
		paramsForLeftLeg.collisionFilter.group = Body.nextGroup(false); // make the left leg not collide with the rest of the body

		var paramsForArm = JSON.parse(JSON.stringify(params)); //same as for the left leg
		paramsForArm.collisionFilter.group = Body.nextGroup(false);

		this.weights = weights;

		this.place = -1; //when the place is -1, it means it is still alive. When the place is positive, it represents how far the robot went

		//make the body
		this.rightThigh = Bodies.rectangle(startLine+15, 470, 20, 40, params);//470-510
		this.leftThigh = Bodies.rectangle(startLine-15, 470, 20, 40, paramsForLeftLeg);//470-510
		this.rightShin = Bodies.rectangle(startLine+15, 500, 20, 40, params);//510-550
		this.leftShin = Bodies.rectangle(startLine-15, 500, 20, 40, paramsForLeftLeg);//510-550
		this.torso = Bodies.rectangle(startLine, 420, 20, 40, params);//410-470
		this.arm = Bodies.rectangle(startLine, 420, 20, 40, paramsForArm);
		this.head = Bodies.circle(startLine, 390, 10, params);

		//make all the joints
		this.leftTorsoToLeg = makeConnector(this.leftThigh, this.torso, 0,-15, 0,15);
		this.rightTorsoToLeg = makeConnector(this.rightThigh, this.torso, 0,-15, 0,15);
		this.rightKnee = makeConnector(this.rightShin, this.rightThigh, 0,-15, 0,15);
		this.leftKnee = makeConnector(this.leftShin, this.leftThigh, 0,-15, 0,15);
		this.sholder = makeConnector(this.arm, this.torso, 0,-15, 0,-10);

		this.neck = makeConnector(this.head, this.torso, 0,0, 0,-30);

		// each robot gets its own world so they don't intersect
		this.world = World.add(engine.world, [
			ground,
			...this.getAllParts()
		]);
		bobs.push(this); //add this to the list of bobs
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
		//draws each limb in the color specified
		appearRect(this.leftThigh.vertices, col);
		appearRect(this.leftShin.vertices, col);

		appearRect(this.rightThigh.vertices, col);
		appearRect(this.rightShin.vertices, col);

		appearRect(this.torso.vertices, col);
		appearCirc(this.head, col);
		appearRect(this.arm.vertices, col);
	}
	move(speed){ //this function isn't needed anymore, but it used to move all of the robots backwards and create a scrolling effect
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
	//shorthand for constraint.create with all of the settings needed
	return Constraint.create({
		bodyA: bodyA,
		bodyB: bodyB,
		pointA: {x: aX, y: aY}, //where on body A is the connector
		pointB: {x: bX, y: bY}, //where on body B is the connector
		stiffness: 1,
		length: 0,
		damping: 0.1 //don't jiggle around
	})
}

function start(){
	el("generation").innerHTML = "Generation 1";
	drawAll();
}

function endGeneration(speed){
	//add to the graph of all of the speeds (the skinny canvas at the bottom)
	var showSp = el("showSpeed").getContext("2d");
	showSp.fillRect(graphPosition, 100-speed*33, 1,1);
	graphPosition++;

	console.log(speed);
	genNumber ++;
	el("generation").innerHTML = "Generation: "+genNumber+", Speed: "+(speed);
	timePassed = 0;
	numberBotsDead = 0;

	//reset everything
	World.clear(engine.world);
	Engine.clear(engine);
	newGeneration(); //this is defined in ml.js
}

function drawAll(){
	timePassed ++;
	var shouldDisplay = el("watch").checked || timePassed % 10 == 0 // only display if the watch button is checked, or every 10 times if the watch button isn't checked

	Matter.Runner.tick(runner, engine, 30); //move time forwards 30 milliseconds

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

	bobs.forEach((item,index) =>{ //iterate through the list of bobs
		if(timePassed % 5 == 1){ //only moves the character every 5 times so it doesn't vibrate
			moveBob(item); 
		}

		if(item.place == -1){ //only run this part if it's still alive
			if(index == bobs.length-1 && shouldDisplay){ //if it is the best one of the previous generation, make it white
				item.draw("rgba(255,255,255, 1)");
			}else if(shouldDisplay){ //if not, color it rainbow and make it semi-transparent
				item.draw("hsla("+index*360/bobs.length+", 100%, 70%, 30%)");
			}

			if(item.head.bounds.max.y > 480 || item.torso.bounds.max.y > 550 || timePassed > 100){
				//kill a robot. sets to static so the computer doesn't have to worry about moving the robot anymore.
				Body.setStatic(item.rightThigh, true); 
				Body.setStatic(item.leftThigh, true); 
				Body.setStatic(item.rightShin, true); 
				Body.setStatic(item.leftShin, true); 
				Body.setStatic(item.torso, true); 
				Body.setStatic(item.arm, true); 
				Body.setStatic(item.head, true); 

				item.place = closestPos(item); // the closest position to the starting line

				numberBotsDead++;
				if(numberBotsDead == bobs.length){
					var prevWinner = bobs[bobs.length-1];
					var speed = (closestPos(prevWinner) - startLine)/timePassed * 6/5280/80 * 12000; //tries to convert this to mph, but this doesn't work.
					endGeneration(speed);
				}
			}
		}
	});

	// i used a recursive function instead of setTimeout so it doesn't lag.
	if(!el("watch") || el("watch").checked){
		setTimeout(drawAll, 30);
	}else{
		setTimeout(drawAll,1);
	}
}

function appearRect(verts,col){
	ctx.fillStyle = col;
	ctx.beginPath();
	ctx.moveTo(verts[0].x, verts[0].y)// go to the first vertex
	for (var i = 1; i < verts.length; i++) {
		ctx.lineTo(verts[i].x, verts[i].y); // draw each of the next verticies
	}
	ctx.lineTo(verts[0].x, verts[0].y); //go back to the first one
	ctx.fill(); // fill it
	ctx.stroke(); // add a border
}
function appearCirc(toDraw, col){
	ctx.fillStyle = col;
	//draw the circle
	ctx.beginPath();
	ctx.arc(toDraw.position.x, toDraw.position.y, toDraw.circleRadius, 0, 2*Math.PI)
	ctx.fill(); //fill
	ctx.stroke(); // add a border

	// the mouth
	ctx.beginPath();
	ctx.arc(toDraw.position.x+3, toDraw.position.y,toDraw.circleRadius/3,0,Math.PI,false); 
	ctx.stroke();

	// first eyeball
	ctx.beginPath();
	ctx.arc(toDraw.position.x, toDraw.position.y-3,0.5,0,Math.PI*2,false); 
	ctx.stroke();

	//second eyeball
	ctx.beginPath();
	ctx.arc(toDraw.position.x+6, toDraw.position.y-3,0.5,0,Math.PI*2,false); 
	ctx.stroke();
}

function el(id){ return document.getElementById(id)};