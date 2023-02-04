/*
require modules:
myVector
myMatrix
*/

 
/*
mass: kg
long: m
*/



class physic_object{
	constructor(x,y,mass=0,material='default',resistance=0,angular_resistance=0){
		this.world=null
		this.position=[x,y]
		this.velocity=[0,0]
		this.angle=0
		this.omega=[0,0,0]
		this.forces=[]
		this.mass=mass
		this.resistance=resistance
		this.angular_resistance=angular_resistance
		this.isgravity=true
		this.iscollision=true
		this.material=material
		this.collision=function(e){}
	}
	add_force(id,point=[0,0],force=[0,0]){
		this.forces.push({id:id,point:point,force:force})
	}
	remove_force(id){
		for(let i in this.forces){
			if(this.forces[i].id===id){
				this.forces.splice(i,1)
			}
		}
	}
	get_force(id){
		for(let i of this.forces){
			if(i.id===id){
				return i
			}
		}
	}
}




class ball extends physic_object{
	constructor(x,y,radius,mass=0,material='default',resistance=0,angular_resistance=0,get_inertia=true){
		super(x,y,mass,material,resistance,angular_resistance)
		this.type='ball'
		this.radius=radius
		this.inertia=0
		this.area=Math.PI*this.radius**2
		if(get_inertia){
			this.inertia=this.mass*this.radius**2/2
		}
	}
}


class polygon extends physic_object{
	constructor(x,y,points,mass=0,material='default',resistance=0,angular_resistance=0,locate_at_center=true,get_inertia=true){
		super(x,y,mass,material,resistance,angular_resistance)
		this.type='polygon'
		this.points=points
		this.sides=[]
		this.area=this.get_area()
		this.inertia=0
		if(locate_at_center){
			let com=[0,0]
			for(let i of points){
				com[0]+=i[0]
				com[1]+=i[1]
			}
			com[0]/=points.length
			com[1]/=points.length
			for(let i of points){
				i[0]-=com[0]
				i[1]-=com[1]
			}
		}
		if(get_inertia){
			this.inertia=inertiaCalculator.get_object_inertia(this)
		}
		for(let i=0;i<points.length;i++){
			let v=[]
			let k=(i+1)%(points.length)
			v[0]=points[k][0]-points[i][0]
			v[1]=points[k][1]-points[i][1]
			this.sides.push(v)
		}
		this.normals=this.sides.map((side)=>{
			let x=-side[1]
			let y=side[0]
			let abs=Math.sqrt(x**2+y**2)
			x/=abs
			y/=abs
			return [x,y]
		})
		
		
		
	}
	get_area(){
		let ps=this.points.slice()
		let p0=ps.shift()
		let area=0
		for(let i=0;i<ps.length-1;i++){
			let v1=myVector.minus(ps[i],p0)
			let v2=myVector.minus(ps[i+1],p0)
			let det=myMatrix.determinant([v1,v2])
			area+=det/2        
		}
		return area
	}
}


class world{
	constructor(gravityx,gravityy,iteration=50){
		this.gravity=[gravityx,gravityy]
		this.objs=[]
		this.springs=[]
		this.iteration=iteration
		this.accurate=0.99999
		this.coefficients=[]
	}
	add(obj){
		this.objs.push(obj)
		obj.world=this
	}
	delete(obj){
		for(let i in this.objs){
			if(obj===this.objs[i]){
				
				this.objs.splice(i,1)
				obj.world=null

			}
		}
	}
	addSpring(a,b,origin_dis,count,ax=0,ay=0,bx=0,by=0){
		this.springs.push({a:a,b:b,origin_dis:origin_dis,count:count,ap:[ax,ay],bp:[bx,by]})
	}
	removeSpring(a,b,origin_dis,count){
		let ex={a:a,b:b,origin_dis:origin_dis,count:count,ap:[ax,ay],bp:[bx,by]}
		for(let i in this.constraint){
			if(ex===this.constraint[i]){
				this.constraint.splice(i,1)
			}
		}
	}
	getCoefficient(material1,material2){
		for(let i of this.coefficients){
			if((i.object[0]===material1&&i.object[1]===material2)||(i.object[0]===material2&&i.object[1]===material1)){
				return i
			}
		}
		return {object:'default',friction:0,restitution:1}
	}
	setCoefficient(material1,material2,friction=0,restitution=1){
		let coe=this.getCoefficient(material1,material2)
		if(coe.object==='default'){
			this.coefficients.push({
				object:[material1,material2],
				friction:friction,
				restitution:restitution
			})
		}else{
			coe.friction=friction
			coe.restitution=restitution
		}
		

	}
	update(time){
		let time_=time/this.iteration
		for(let k=0;k<this.iteration;k++){
			//彈簧
			for(let i of this.springs){
				let pA=myVector.add(i.a.position,myVector.rotate(i.ap,i.a.angle))  
				let pB=myVector.add(i.b.position,myVector.rotate(i.bp,i.b.angle))  
				let pAB=myVector.minus(pB,pA)
				let dAB=myVector.abs(pAB)
				if(dAB===0){
					continue
				}
				let ff=(dAB-i.origin_dis)*i.count
				this.force_object(i.a,i.ap,myVector.scale(pAB,ff*time_/dAB))
				this.force_object(i.b,i.bp,myVector.scale(pAB,-ff*time_/dAB))
			}
			//重力及阻力
			for(let i of this.objs){
				i.velocity=myVector.scale(i.velocity,(1-i.resistance)**time_)
				i.omega=myVector.scale(i.omega,(1-i.angular_resistance)**time_)

				for(let y of i.forces){
					this.force_object(i,y.point,myVector.scale(y.force,time_))
				}


				if(i.isgravity){
					i.velocity[0]+=this.gravity[0]*time_
					i.velocity[1]+=this.gravity[1]*time_
				}
			}
			//碰撞
			
			for(let i=0;i<this.objs.length-1;i++){
				for(let y=i+1;y<this.objs.length;y++){
					if(this.objs[i].iscollision&&this.objs[y].iscollision){
						this.collision(this.objs[i],this.objs[y])
						
					}
				}
			}
			

			//改變位置
			for(let i of this.objs){
				i.position[0]+=i.velocity[0]*time_
				i.position[1]+=i.velocity[1]*time_
				i.angle+=i.omega[2]*time_
				i.angle=i.angle%(2*Math.PI)
				
			}

		}
	}
	collision(a,b){
		//若兩物皆為無限重則不碰撞
		if(a.mass===Infinity&&b.mass===Infinity){
			return
		}

		//分辨碰撞種類

		let at=a.type
		let bt=b.type
		if(at==='polygon'&&bt==='polygon'){
			this.collision_polygon_polygon(a,b)
		}else if(at==='ball'&&bt==='ball'){
			this.collision_ball_ball(a,b)
		}else if(at==='ball'){
			this.collision_ball_polygon(a,b)
		}else{
			this.collision_ball_polygon(b,a)
			
		}
					

		
	}
	impact(a,b,normal_vector,min_overlap,collision_point){

		a.collision({self:a,object:b,collision_point:collision_point})
		b.collision({self:b,object:a,collision_point:collision_point})
			
		let overlapAB=myVector.scale(normal_vector,min_overlap)
		if(a.mass===Infinity){
			b.position=myVector.add(b.position,overlapAB)
		}else if(b.mass===Infinity){
			a.position=myVector.minus(a.position,overlapAB)
		}else{
			b.position=myVector.add(b.position,myVector.scale(overlapAB,a.mass/(a.mass+b.mass)))
			a.position=myVector.minus(a.position,myVector.scale(overlapAB,b.mass/(a.mass+b.mass)))
		}

		
		

		//a與b質心到碰撞點的位移
		let dAc=myVector.minus(collision_point,a.position)
		let dBc=myVector.minus(collision_point,b.position)
		//a與b在碰撞點的速度
		let vA=myVector.add(a.velocity,myVector.cross(a.omega,dAc.concat([0])).slice(0,2))
		let vB=myVector.add(b.velocity,myVector.cross(b.omega,dBc.concat([0])).slice(0,2))
		//a對b的相對速度(碰撞點)
		let vAB=myVector.minus(vA,vB)

		
		
		//若內積>0 => 夾角<90。 => 逐漸靠近
		if(myVector.dot(vAB,overlapAB)>0){
			//由材料名取得對應係數
			let coefficient=this.getCoefficient(a.material,b.material)
			let d1=myVector.scale(dAc,-1).concat([0])
			let d2=myVector.scale(dBc,-1).concat([0])
			let v1=a.velocity.concat([0])
			let v2=b.velocity.concat([0])
			let n=myVector.scale(normal_vector,Math.sign(min_overlap)).concat([0])

			let d1Xn=myVector.cross(d1,n)
			let d2Xn=myVector.cross(d2,n)
			let denominator=myVector.abs(d1Xn)**2/a.inertia+
							myVector.abs(d2Xn)**2/b.inertia+
							myVector.abs(n)**2/a.mass+
							myVector.abs(n)**2/b.mass
			let numerator=-2*myVector.dot(a.omega,d1Xn)+
						  2*myVector.dot(b.omega,d2Xn)+
						  2*myVector.dot(v1,n)+
						  -2*myVector.dot(v2,n)
			let k=numerator/denominator
			k*=(coefficient.restitution+1)/2

			

			a.velocity=myVector.add(a.velocity,myVector.scale(n,-k/a.mass))
			b.velocity=myVector.add(b.velocity,myVector.scale(n,k/b.mass))
			a.omega=myVector.add(a.omega,myVector.scale(d1Xn,k/a.inertia))
			b.omega=myVector.add(b.omega,myVector.scale(d2Xn,-k/b.inertia))


			//a與b在碰撞點的速度
			vA=myVector.add(a.velocity,myVector.cross(a.omega,dAc.concat([0])).slice(0,2))
			vB=myVector.add(b.velocity,myVector.cross(b.omega,dBc.concat([0])).slice(0,2))
			//a對b的相對速度(碰撞點)
			vAB=myVector.minus(vA,vB)

			
			
			//摩擦力
			let f=myVector.rotate(myVector.scale(n,k).slice(0,2),Math.PI/2).concat([0])
			let w1Xd1=myVector.cross(a.omega,d1)
			let w2Xd2=myVector.cross(b.omega,d2)
			let d1XfXd1=myVector.cross(myVector.cross(d1,f),d1)
			let d2XfXd2=myVector.cross(myVector.cross(d2,f),d2)
			

			let numerator_f=myVector.dot(w1Xd1,f)-
							myVector.dot(w2Xd2,f)-
							myVector.dot(v1,f)+
							myVector.dot(v2,f)
							
			let denominator_f=myVector.dot(d1XfXd1,f)/a.inertia+
							  myVector.dot(d2XfXd2,f)/b.inertia+
							  myVector.abs(f)**2/a.mass+
							  myVector.abs(f)**2/b.mass

			let umax=numerator_f/denominator_f

			
			let u=coefficient.friction
			if(u>Math.abs(umax)){
				u=umax
			}else{
				u*=Math.sign(umax)
			}




			a.omega=myVector.add(a.omega,myVector.scale(myVector.cross(d1,f),-u/a.inertia))
			b.omega=myVector.add(b.omega,myVector.scale(myVector.cross(d2,f),u/b.inertia))
			a.velocity=myVector.add(a.velocity,myVector.scale(f,u/a.mass))
			b.velocity=myVector.add(b.velocity,myVector.scale(f,-u/b.mass))




			
			
		}

	}
	collision_polygon_polygon(a,b){
		
		//將法向量與頂點依據當前角位置旋轉
		let pointsA=a.points.map((point)=>{
			return myVector.rotate(point,a.angle)
		})
		let pointsB=b.points.map((point)=>{
			return myVector.rotate(point,b.angle)
		})
		let normalsA=a.normals.map((normal)=>{
			return myVector.rotate(normal,a.angle)
		})
		let normalsB=b.normals.map((normal)=>{
			return myVector.rotate(normal,b.angle)
		})




		let normal_vector
		let collision_point
		let min_overlap=Infinity//min_overlap*normal_vector必指向b

		//將各頂點投影到各邊的法向量上，若投影皆有重疊則圖形有重疊

		for(let normal of normalsA){
			let amax=-Infinity
			let amin=Infinity
			let bmax=-Infinity
			let bmin=Infinity
			let bmax_point
			let bmin_point

			for(let point of pointsA){
				let cast=myVector.dot(normal,myVector.add(a.position,point))
				if(cast<amin){
					amin=cast
				}
				if(cast>amax){
					amax=cast
				}
			}
			for(let point of pointsB){
				let cast=myVector.dot(normal,myVector.add(b.position,point))
				if(cast<bmin){
					bmin=cast
					bmin_point=point
				}
				if(cast>bmax){
					bmax=cast
					bmax_point=point
				}
			}
			if(amax<bmin||bmax<amin){
				return
			}else{
				if(bmax>amax||bmin>amin){
					let overlap=amax-bmin
					if(Math.abs(overlap)<Math.abs(min_overlap)){
						min_overlap=overlap
						collision_point=myVector.add(bmin_point,b.position)
						normal_vector=normal
					}
				}else if(bmax<amax||bmin<amin){
					let overlap=amin-bmax
					if(Math.abs(overlap)<Math.abs(min_overlap)){
						min_overlap=overlap
						collision_point=myVector.add(bmax_point,b.position)
						normal_vector=normal
					}
				}
			}

		}
		for(let normal of normalsB){
			let amax=-Infinity
			let amin=Infinity
			let bmax=-Infinity
			let bmin=Infinity
			let amax_point
			let amin_point

			for(let point of pointsA){
				let cast=myVector.dot(normal,myVector.add(a.position,point))
				if(cast<amin){
					amin=cast
					amin_point=point
				}
				if(cast>amax){
					amax=cast
					amax_point=point
				}
			}
			for(let point of pointsB){
				let cast=myVector.dot(normal,myVector.add(b.position,point))
				if(cast<bmin){
					bmin=cast
				}
				if(cast>bmax){
					bmax=cast
				}
			}
			if(amax<bmin||bmax<amin){
				return
			}else{
				if(bmax>amax||bmin>amin){
					let overlap=amax-bmin
					if(Math.abs(overlap)<Math.abs(min_overlap)){
						min_overlap=overlap
						collision_point=myVector.add(amax_point,a.position)
						normal_vector=normal
					}
				}else if(bmax<amax||bmin<amin){
					let overlap=amin-bmax
					if(Math.abs(overlap)<Math.abs(min_overlap)){
						min_overlap=overlap
						collision_point=myVector.add(amin_point,a.position)
						normal_vector=normal
					}
				}
			}

		}

		this.impact(a,b,normal_vector,min_overlap,collision_point)

		


	}
	collision_ball_polygon(a,b){
		
		//將法向量與頂點依據當前角位置旋轉
		let pointsB=b.points.map((point)=>{
			return myVector.rotate(point,b.angle)
		})
		let normalsB=b.normals.map((normal)=>{
			return myVector.rotate(normal,b.angle)
		})



		let normal_vector=[]
		let collision_point
		let min_overlap=Infinity//min_overlap*normal_vector必指向b
		let min_dis=Infinity
		let min_dis_normal
		for(let point of pointsB){
			let pB=myVector.add(b.position,point)
			let pOB=myVector.minus(pB,a.position)
			let dOB=myVector.abs(pOB)
			if(dOB<min_dis&&dOB!==0){
				min_dis=dOB
				min_dis_normal=myVector.scale(pOB,1/dOB)
			}
		}
		normalsB.push(min_dis_normal)
		for(let normal of normalsB){
			
			let amax=-Infinity
			let amin=Infinity
			let bmax=-Infinity
			let bmin=Infinity
			let amax_point
			let amin_point

			let castO=myVector.dot(normal,a.position)
			amin=castO-a.radius
			amin_point=myVector.scale(normal,-a.radius)
			amax=castO+a.radius
			amax_point=myVector.scale(normal,a.radius)
			
			for(let point of pointsB){
				let cast=myVector.dot(normal,myVector.add(b.position,point))
				if(cast<bmin){
					bmin=cast
				}
				if(cast>bmax){
					bmax=cast
				}
			}
			if(amax<=bmin||bmax<=amin){
				return
			}else{
				if(bmax>amax||bmin>amin){
					let overlap=amax-bmin
					if(Math.abs(overlap)<Math.abs(min_overlap)){
						min_overlap=overlap
						collision_point=myVector.add(amax_point,a.position)
						normal_vector=normal
					}
				}else if(bmax<amax||bmin<amin){
					let overlap=amin-bmax
					if(Math.abs(overlap)<Math.abs(min_overlap)){
						min_overlap=overlap
						collision_point=myVector.add(amin_point,a.position)
						normal_vector=normal
					}
				}
			}

		
		}
		this.impact(a,b,normal_vector,min_overlap,collision_point)
		

	}
	collision_ball_ball(a,b){
		
		//A對於B的相對位置
		let pAB=myVector.minus(b.position,a.position)
		let dis=myVector.abs(pAB)
		let normal_vector
		let collision_point
		let min_overlap=a.radius+b.radius-dis
		//若是A與B有重疊(距離<A半徑+B半徑)
		if(min_overlap<=0){
			return
		}else if(dis!==0){
			normal_vector=myVector.scale(pAB,1/dis)
			collision_point=myVector.add(a.position,myVector.scale(normal_vector,a.radius))
		}
		this.impact(a,b,normal_vector,min_overlap,collision_point)

	}
	force_object(obj,point,impulse){
		let r1=myVector.rotate(point,obj.angle)
		let r1Xf=myVector.cross(r1.concat([0]),impulse.concat([0]))
		obj.velocity=myVector.add(obj.velocity,myVector.scale(impulse,1/obj.mass))
		obj.omega=myVector.add(obj.omega,myVector.scale(r1Xf,1/obj.inertia))

	}
	draw_helper(obj,color,fill=true,through=1,ctx_=ctx){
		ctx_.globalAlpha=through
		ctx_.fillStyle=color
		ctx_.strokeStyle=color
		if(obj.type==='ball'){
			ctx_.save()
			ctx_.translate(obj.position[0],obj.position[1])
			ctx_.rotate(obj.angle)
			ctx_.beginPath()
			ctx_.arc(0,0,obj.radius,0.1,Math.PI*2-0.1)
			ctx_.lineTo(0,0)
			ctx_.closePath() 
			ctx_.restore()
			
		}else if(obj.type==='polygon'){
			ctx_.save()
			ctx_.translate(obj.position[0],obj.position[1])
			ctx_.rotate(obj.angle)
			ctx_.beginPath()
			ctx_.moveTo(obj.points[0][0],obj.points[0][1])
			
			for(let i=1;i<obj.points.length;i++){
				ctx_.lineTo(obj.points[i][0],obj.points[i][1])
			}
			ctx_.closePath()
			ctx_.restore()
		}
		if(fill){
			ctx_.fill()	
		}else{
			ctx_.stroke()
		}
		ctx_.globalAlpha=1
	}
}

class inertiaCalculator{
	constructor(){

	}
	static divide(points=[],mass=0){
		let ps=points.slice()
		let p0=ps.shift()
		let tris=[]
		let dets=0
		for(let i=0;i<ps.length-1;i++){
			let tri=[p0,ps[i],ps[i+1]]
			let v1=myVector.minus(tri[1],tri[0])
			let v2=myVector.minus(tri[2],tri[0])
			let det=myMatrix.determinant([v1,v2])
			tri.push(det)
			tris.push(tri)
			dets+=det        
		}
	
		for(let i of tris){
			i[3]*=mass/dets
		}
		
		return tris
	}
	
	
	static inertia_of_triangle(tri){
		//get transfer matrix
		let v01=myVector.minus(tri[1],tri[0])
		let deg=Math.acos(myVector.dot(v01,[0,1])/myVector.abs(v01))*Math.sign(v01[0])
		let tm=[[Math.cos(deg),-Math.sin(deg)],
				[Math.sin(deg),Math.cos(deg)]]
		//transfer triangle
		let ps=tri.slice(0,3)
		for(let i in ps){
			ps[i]=myMatrix.matrixMultiplyVector(tm,ps[i])
		}
	
		//calculate
		let A=ps[0][1]
		let B=ps[1][1]
		let T=ps[2][1]
		let L=ps[0][0]
		let R=ps[2][0]
		
		let I=  (T**2+R**2)/2+
				((A+B-2*T)*T+2*R*(L-R))/3+
				((A-T)**2+(B-T)**2+(A-T)*(B-T))/12+
				(L-R)**2/4
		I*=tri[3]*2
		return I
		
		
		
	
	}
	
	static get_moment_of_inertia(points=[],mass=0){
		let tris=this.divide(points,mass)
		let I_total=0
		for(let i in tris){
			I_total+=this.inertia_of_triangle(tris[i])
		}
		return I_total
	
	}
	static get_object_inertia(obj){
		return this.get_moment_of_inertia(obj.points,obj.mass)

	}
}

/*
export default {
	ball,
	rect,
	world
}*/