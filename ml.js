if(trainedWeights){
	//pre-trained model
	for (var i = 0; i < 7; i++) {
		var x = new Bob(trainedWeights)
	}
}else{
	// create 64 random ones
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
	// run the neural network
	// there are no biases or weights so this is really simple
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

	for (var i = 0; i < 5; i++) { // for some reason the weights make it worse so i removed them.
		//outputs[i] += obj.weights[i+35];
	}

	// move the body parts with the outputs of the NN
	Body.setAngularVelocity(obj.rightThigh,activation(outputs[0]));
	Body.setAngularVelocity(obj.leftThigh,activation(outputs[1]));
	Body.setAngularVelocity(obj.rightShin,activation(outputs[2]));
	Body.setAngularVelocity(obj.leftShin,activation(outputs[3]));
	Body.setAngularVelocity(obj.arm,activation(outputs[4]));
}

function activation(inp){
	//return 2/(1 + Math.E**(-inp)) - 1
	return Math.sin(inp*5); //idk why but the sine wave works best
}

function newGeneration(){
	var sorted = bobs.sort((a,b)=>{
		return b.place - a.place;
	});
	// sorts the bobs by place (distance from the start)
	bobs = [];


	// asexual reproduction
	haveKids(sorted[0], 25); //have 25 kids from the best one
	haveKids(sorted[1], 10); //have 10 kids from the next best
	haveKids(sorted[2], 5); //etc.
	haveKids(sorted[3], 5);
	haveKids(sorted[4], 4);
	haveKids(sorted[5], 3);
	haveKids(sorted[6], 2);

	// ad 10 completely random ones
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

	// in order to make sure it never gets worse, add back the best 5 from the previous generation
	new Bob(sorted[4].weights);
	new Bob(sorted[3].weights);
	new Bob(sorted[2].weights);
	new Bob(sorted[1].weights);
	new Bob(sorted[0].weights);
}

function haveKids(parent, numKids, amountChange){
	for (var i = 0; i < numKids; i++) {
		var newWeights = JSON.parse(JSON.stringify(parent.weights)); // when we change newWeights, we don't change the old weights
		// i have to use JSON.parse and JSON.stringify because JavaScript is weird that way.

		for (var j = 0; j < newWeights.length; j++) {
			if(Math.random() < 0.1){
				newWeights[j] += (rand()**5)*el("creativity").value; //changes it. when the creativity slider is high,then it changes a lot, but when it is low, it doesn't change much
			}
		}

		var newBob = new Bob(newWeights);
	}
}

function closestPos(ob){
	var limbs = [
		ob.rightThigh.bounds.min.x, // the limb's lowest x position
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