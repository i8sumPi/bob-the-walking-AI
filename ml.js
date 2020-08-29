if(trainedWeights){
	//pre-trained model
	for (var i = 0; i < 7; i++) {
		var x = new Bob(trainedWeights)
	}
}else{
	//first 35 weights are weights, last 5 are biases
	for (var i = 0; i < 64; i++) {
		var weights = [];
		for (var j = 0; j < 35; j++) {
			weights.push(rand());
		}
		weights.push(0);
		weights.push(0);
		weights.push(0);
		weights.push(0);
		weights.push(0);

		var x = new Bob(weights)
	}
}

function moveBob(obj){
	var inputs = [
		obj.leftTorsoToLeg.angleA/Math.PI/2,
		obj.rightTorsoToLeg.angleA/Math.PI/2,
		obj.rightKnee.angleA/Math.PI/2,
		obj.leftKnee.angleA/Math.PI/2,
		obj.torso.angle/Math.PI/2,
		1/(1+Math.E**(550-obj.leftShin.bounds.max.y)),
		1/(1+Math.E**(550-obj.rightShin.bounds.max.y))
	];

	var outputs = [0,0,0,0,0];

	for (var i = 0; i < 35; i++) {
		outputs[Math.floor(i/5)] += obj.weights[i] * inputs[i%7];
	}

	for (var i = 0; i < 5; i++) {
		//outputs[i] += obj.weights[i+35];
	}

	Body.setAngularVelocity(obj.rightThigh,activation(outputs[0]));
	Body.setAngularVelocity(obj.leftThigh,activation(outputs[1]));
	Body.setAngularVelocity(obj.rightShin,activation(outputs[2]));
	Body.setAngularVelocity(obj.leftShin,activation(outputs[3]));
	Body.setAngularVelocity(obj.arm,activation(outputs[4]));
}

function activation(inp){
	//return 2/(1 + Math.E**(-inp)) - 1
	return Math.sin(inp*5);
}

function newGeneration(){
	var sorted = bobs.sort((a,b)=>{
		return b.place - a.place;
	});
	bobs = [];


	haveKids(sorted[0], 25);
	haveKids(sorted[1], 10);
	haveKids(sorted[2], 5);
	haveKids(sorted[3], 5);
	haveKids(sorted[4], 4);
	haveKids(sorted[5], 3);
	haveKids(sorted[6], 2);

	for (var i = 0; i < 10; i++) {
		var weights = [];
		for (var j = 0; j < 35; j++) {
			weights.push(rand());
		}
		weights.push(0);
		weights.push(0);
		weights.push(0);
		weights.push(0);
		weights.push(0);
		new Bob(weights)
	}

	new Bob(sorted[4].weights);
	new Bob(sorted[3].weights);
	new Bob(sorted[2].weights);
	new Bob(sorted[1].weights);
	new Bob(sorted[0].weights);
}

function haveKids(parent, numKids, amountChange){
	for (var i = 0; i < numKids; i++) {
		var newWeights = JSON.parse(JSON.stringify(parent.weights));

		for (var j = 0; j < newWeights.length; j++) {
			if(Math.random() < 0.1){
				newWeights[j] += (rand()**5)*2;
			}
		}

		var newBob = new Bob(newWeights);
	}
}

function closestPos(ob){
	var limbs = [
		ob.rightThigh.bounds.min.x, 
		ob.leftThigh.bounds.min.x, 
		ob.rightShin.bounds.min.x, 
		ob.leftShin.bounds.min.x, 
		ob.torso.bounds.min.x, 
		ob.arm.bounds.min.x, 
		ob.head.bounds.min.x, 
	];
	return Math.min(...limbs);
}

function rand(){
	return Math.random()-0.5;
}

function exportWeights(){
	console.log(JSON.stringify(bobs[bobs.length-1].weights));
}