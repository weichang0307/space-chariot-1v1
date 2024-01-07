/*
require modules:
myVector
myMatrix
*/

 
/*
mass: kg
long: m
*/


/*
let myMatrix=require('./myMatrix')
let myVector=require('./myVector')
module.exports={ball:ball,polygon:polygon,world:world}
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
		//point為施力點對中心的位移(角位置=0時)
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
		this.rmax=this.radius
		//計算面積
		this.area=Math.PI*this.radius**2
		//計算轉動慣量
		this.inertia=0
		if(get_inertia){
			this.inertia=this.mass*this.radius**2/2
		}
	}
	set_mass(mass,get_inertia=true){
		this.mass=mass
		if(get_inertia){
			this.inertia=this.mass*this.radius**2/2
		}
	}
	set_mass_by_density(density,get_inertia=true){
		this.mass=Math.PI*this.radius**2*density
		if(get_inertia){
			this.inertia=this.mass*this.radius**2/2
		}
	}
}


class polygon extends physic_object{
	constructor(x,y,points=[],mass=0,material='default',resistance=0,angular_resistance=0,locate_at_center=true,get_inertia=true){
		super(x,y,mass,material,resistance,angular_resistance)
		this.type='polygon'
		//各頂點對物體中心的位移
		this.points=points
		//取得面積
		this.area=this.get_area()
		//將幾何中心定為物體中心
		if(locate_at_center){
			let com=this.get_center()
			for(let i of this.points){
				i[0]-=com[0]
				i[1]-=com[1]
			}
		}
		//物體中距物體中心最遠的距離
		this.rmax=0
		for(let i of this.points){
			let r=myVector.abs(i)
			if(r>this.rmax){
				this.rmax=r
			}
		}
		//計算轉動慣量
		this.inertia=0
		if(get_inertia){
			this.inertia=inertiaCalculator.get_object_inertia(this)
		}
		//取得物體的各個邊
		this.sides=[]
		for(let i=0;i<points.length;i++){
			let v=[]
			let k=(i+1)%(points.length)
			v[0]=points[k][0]-points[i][0]
			v[1]=points[k][1]-points[i][1]
			this.sides.push(v)
		}
		//取得各個邊的法向量(單位向量)
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
		//切成數個三角形計算面積再加總
		let area=0
		for(let i=0;i<ps.length-1;i++){
			let v1=myVector.minus(ps[i],p0)
			let v2=myVector.minus(ps[i+1],p0)
			//用行列式計算三角形面積
			let det=myMatrix.determinant([v1,v2])
			area+=det/2        
		}
		return area
	}
	get_center(){
		let ps=this.points.slice()
		let p0=ps.shift()
		//切成數個三角形求質心再以面積加權平均
		let area=0
		let com=[0,0]
		for(let i=0;i<ps.length-1;i++){
			//求三角形重心
			let center=myVector.scale(myVector.add(p0,ps[i],ps[i+1]),1/3)
			//用行列式計算三角形面積
			let v1=myVector.minus(ps[i],p0)
			let v2=myVector.minus(ps[i+1],p0)
			let det=myMatrix.determinant([v1,v2])
			area+=det/2  
			//加權
			com=myVector.add(com,myVector.scale(center,det/2))
		}
		//平均
		return myVector.scale(com,1/area)
	}
	set_mass(mass,get_inertia=true){
		this.mass=mass
		if(get_inertia){
			this.inertia=inertiaCalculator.get_object_inertia(this)
		}
	}
	set_mass_by_density(density,get_inertia=true){
		this.mass=this.get_area()*density
		
		if(get_inertia){
			this.inertia=inertiaCalculator.get_object_inertia(this)
		}
	}
}


class world{
	constructor(gravityx,gravityy,iteration=50){
		this.gravity=[gravityx,gravityy]
		this.objs=[]
		this.springs=[]
		this.coefficients=[]
		//每次update的迭代次數
		this.iteration=iteration
		//校正位置時的參數
		this.accuracy=1
		
	}
	add(obj){
		this.objs.push(obj)
		obj.world=this
	}
	delete(obj){
		for(let i in this.objs){
			if(obj===this.objs[i]){
				obj.world=null
				this.objs.splice(i,1)
				

			}
		}
	}
	addSpring(a,b,origin_dis,count,ap=[0,0],bp=[0,0],stretch=true,compress=true){
		//ap為a的附著點對a中心的位移(角位置=0時)
		//bp為b的附著點對b中心的位移(角位置=0時)
		let id=Date.now()
		this.springs.push({id:id,a:a,b:b,origin_dis:origin_dis,count:count,ap:ap,bp:bp,compress:compress,stretch:stretch})
		return id
	}
	removeSpring(id){
		for(let i in this.springs){
			if(this.springs[i].id===id){
				this.springs.splice(i,1)
			}
		}
	}
	getSpring(id){
		for(let i of this.springs){
			if(i.id===id){
				return i
			}
		}
	}
	getCoefficient(material1,material2){
		for(let i of this.coefficients){
			if((i.object[0]===material1&&i.object[1]===material2)||(i.object[0]===material2&&i.object[1]===material1)){
				return i
			}
		}
		//若找不到材料的係數(未設定)則回傳
		return {object:'default',friction:0,restitution:1}
	}
	setCoefficient(material1,material2,friction=0,restitution=1){
		let coe=this.getCoefficient(material1,material2)
		//若尚未設定(找不到係數)
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
		//每次迭代經過的時間
		let time_=time/this.iteration
		for(let k=0;k<this.iteration;k++){
			//彈簧
			for(let i of this.springs){
				//彈簧兩端的附著點
				let pA=myVector.add(i.a.position,myVector.rotate(i.ap,i.a.angle))  
				let pB=myVector.add(i.b.position,myVector.rotate(i.bp,i.b.angle))  
				//當前彈簧兩端距離
				let pAB=myVector.minus(pB,pA)
				let dAB=myVector.abs(pAB)
				
				if(dAB===0){
					//避免分母=0
					continue
				}else if(dAB-i.origin_dis>0){
					//對拉伸不反應
					if(!i.stretch){
						continue
					}
				}else if(dAB-i.origin_dis<0){
					//對壓縮不反應
					if(!i.compress){
						continue
					}
				}
				if(i.count===Infinity){
					//校正位置(不讓長度改變)
					let stretch=myVector.scale(pAB,(i.origin_dis-dAB)/dAB)
					if(i.a.mass===Infinity){
						i.b.position=myVector.add(i.b.position,stretch)
					}else if(i.b.mass===Infinity){
						i.a.position=myVector.minus(i.a.position,stretch)
					}else{
						i.b.position=myVector.add(i.b.position,myVector.scale(stretch,i.a.mass/(i.a.mass+i.b.mass)))
						i.a.position=myVector.minus(i.a.position,myVector.scale(stretch,i.b.mass/(i.a.mass+i.b.mass)))
					}
					//類完全非彈性碰撞
					let k=this.collision_funtion(i.a,i.b,myVector.rotate(i.ap,i.a.angle),myVector.rotate(i.bp,i.b.angle),pAB,0)
					if((k>0&&i.stretch)||(k<0&&i.compress)){
						this.force_object(i.a,pA,myVector.scale(pAB,k))
						this.force_object(i.b,pA,myVector.scale(pAB,-k))
					}
				}else{
					//彈力=伸縮量*彈力係數
					let ff=(dAB-i.origin_dis)*i.count
					this.force_object_fixed(i.a,i.ap,myVector.scale(pAB,ff*time_/dAB))
					this.force_object_fixed(i.b,i.bp,myVector.scale(pAB,-ff*time_/dAB))
				}
				
			}
			//重力及受力
			for(let i of this.objs){
				
				//受力(預先設定的)
				for(let y of i.forces){
					this.force_object_fixed(i,y.point,myVector.scale(y.force,time_))
				}

				//重力作用
				if(i.isgravity){
					i.velocity[0]+=this.gravity[0]*time_
					i.velocity[1]+=this.gravity[1]*time_
				}
			}
			//碰撞
			//此雙層迴圈使每兩個物體僅檢測一次
			for(let i=0;i<this.objs.length-1;i++){
				for(let y=i+1;y<this.objs.length;y++){
					if(this.objs[i].iscollision&&this.objs[y].iscollision){
						this.collision(this.objs[i],this.objs[y])
					}
				}
			}
			

			//阻力及改變位置
			for(let i of this.objs){
				//阻力
				i.velocity=myVector.scale(i.velocity,(1-i.resistance)**time_)
				//角阻力
				i.omega=myVector.scale(i.omega,(1-i.angular_resistance)**time_)

				//改變位置
				i.position[0]+=i.velocity[0]*time_
				i.position[1]+=i.velocity[1]*time_
				//改變角位置
				i.angle+=i.omega[2]*time_
				//避免角位置量值太大
				i.angle=i.angle%(2*Math.PI)
				
			}

		}
	}
	collision(a,b){
		//若兩物皆為無限重則不碰撞
		if(a.mass===Infinity&&b.mass===Infinity){
			return
		}
		//若距離太遠不可能碰撞則不檢測
		let dis=myVector.minus(a.position,b.position)
		if(myVector.abs(dis)>a.rmax+b.rmax){
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
		
		//呼叫a和b的collision函數
		let isa=a.collision({self:a,object:b,collision_point:collision_point})
		let isb=b.collision({self:b,object:a,collision_point:collision_point})
		if(isa===false||isb===false){
			return
		}
		//校正位置(不讓物體重疊)
		let overlapAB=myVector.scale(normal_vector,min_overlap*this.accuracy)
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

			//代入公式
			let k=this.collision_funtion(a,b,dAc,dBc,normal_vector,coefficient.restitution)
			//改變物體的速度及角速度
			this.force_object(a,collision_point,myVector.scale(normal_vector,k))
			this.force_object(b,collision_point,myVector.scale(normal_vector,-k))


			
			//摩擦力
			let f=myVector.rotate(myVector.scale(normal_vector,k).slice(0,2),Math.PI/2)
			
			//摩擦力最大時的摩擦係數(有方向性)
			let umax=this.collision_funtion(a,b,dAc,dBc,f,0)

			//物體間的摩擦係數(正值)
			let u=coefficient.friction
			//將其加上方向性且量值不超過最大值
			if(u>Math.abs(umax)){
				u=umax
			}else{
				u*=Math.sign(umax)
			}

			//改變物體的速度及角速度
			this.force_object(a,collision_point,myVector.scale(f,u))
			this.force_object(b,collision_point,myVector.scale(f,-u))




			
			
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



		//碰撞響應所需用到的參數
		let normal_vector
		let collision_point
		let min_overlap=Infinity//min_overlap*normal_vector必指向b

		//將各圖形投影到各邊的法向量上，若投影皆有重疊則圖形有重疊
		//重疊最小的法向量視為碰撞發生的方向

		//a的法向量
		for(let normal of normalsA){
			//投影並記錄兩端以及b的對應點(可能為碰撞點)
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
			//若投影不重疊則物體不重疊
			if(amax<bmin||bmax<amin){
				return
			}else{
				//不考慮包含的情況
				//若重疊更少的話則刷新參數
				if(bmax>amax){
					let overlap=amax-bmin
					if(Math.abs(overlap)<Math.abs(min_overlap)){
						min_overlap=overlap
						collision_point=myVector.add(bmin_point,b.position)
						normal_vector=normal
					}
				}else if(bmax<amax){
					let overlap=amin-bmax
					if(Math.abs(overlap)<Math.abs(min_overlap)){
						min_overlap=overlap
						collision_point=myVector.add(bmax_point,b.position)
						normal_vector=normal
					}
				}
			}

		}
		//b的法向量
		for(let normal of normalsB){
			//投影並記錄兩端以及a的對應點(可能為碰撞點)
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
			//若投影不重疊則物體不重疊
			if(amax<bmin||bmax<amin){
				return
			}else{
				//不考慮包含的情況
				//若重疊更少的話則刷新參數
				if(bmax>=amax){
					let overlap=amax-bmin
					if(Math.abs(overlap)<Math.abs(min_overlap)){
						min_overlap=overlap
						collision_point=myVector.add(amax_point,a.position)
						normal_vector=normal
					}
				}else if(bmax<amax){
					let overlap=amin-bmax
					if(Math.abs(overlap)<Math.abs(min_overlap)){
						min_overlap=overlap
						collision_point=myVector.add(amin_point,a.position)
						normal_vector=normal
					}
				}
			}

		}
		//碰撞響應
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


		//碰撞響應所需用到的參數
		let normal_vector=[]
		let collision_point
		let min_overlap=Infinity//min_overlap*normal_vector必指向b

		//取得距圓最近的頂點(最有可能碰撞)對圓心的位移做為圓的法向量
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
		let normals=normalsB.concat([min_dis_normal])

		//將各圖形投影到各法向量上，若投影皆有重疊則圖形有重疊
		//重疊最小的法向量視為碰撞發生的方向
		for(let normal of normals){
			//投影並記錄圓兩端的對應點(可能為碰撞點)
			let amax=-Infinity
			let amin=Infinity
			let bmax=-Infinity
			let bmin=Infinity
			let amax_point
			let amin_point

			//圓的投影
			//先投影圓心再向兩邊加上半徑長的法向量
			let castO=myVector.dot(normal,a.position)
			amin=castO-a.radius
			amin_point=myVector.scale(normal,-a.radius)
			amax=castO+a.radius
			amax_point=myVector.scale(normal,a.radius)
			
			//b頂點的投影
			for(let point of pointsB){
				let cast=myVector.dot(normal,myVector.add(b.position,point))
				if(cast<bmin){
					bmin=cast
				}
				if(cast>bmax){
					bmax=cast
				}
			}

			//若投影不重疊則物體不重疊
			if(amax<=bmin||bmax<=amin){
				return
			}else{
				//不考慮包含的情況
				//若重疊更少的話則刷新參數
				if(bmax>=amax){
					let overlap=amax-bmin
					if(Math.abs(overlap)<Math.abs(min_overlap)){
						min_overlap=overlap
						collision_point=myVector.add(amax_point,a.position)
						normal_vector=normal
					}
				}else if(bmax<amax){
					let overlap=amin-bmax
					if(Math.abs(overlap)<Math.abs(min_overlap)){
						min_overlap=overlap
						collision_point=myVector.add(amin_point,a.position)
						normal_vector=normal
					}
				}
			}

		
		}
		//碰撞響應
		this.impact(a,b,normal_vector,min_overlap,collision_point)

	}
	collision_ball_ball(a,b){
		
		//A對於B的相對位置
		let pAB=myVector.minus(b.position,a.position)
		let dis=myVector.abs(pAB)

		//碰撞響應所需的參數
		let normal_vector
		let collision_point
		let min_overlap=a.radius+b.radius-dis
		//若是A與B有重疊(距離<A半徑+B半徑)
		if(min_overlap<=0){
			return
		}else if(dis!==0){
			//碰撞方向為兩圓心連線
			normal_vector=myVector.scale(pAB,1/dis)
			//碰撞點位於連心線上且距兩圓心的比值為半徑比
			collision_point=myVector.add(a.position,myVector.scale(pAB,a.radius/(a.radius+b.radius)))
		}

		//碰撞響應
		this.impact(a,b,normal_vector,min_overlap,collision_point)

	}
	collision_funtion(a,b,r1,r2,n,R){
		let v1=a.velocity.concat([0])
		let v2=b.velocity.concat([0])
		r1=r1.concat([0])
		r2=r2.concat([0])
		n=n.concat([0])
		let w1=a.omega
		let w2=b.omega
		let i1=a.inertia
		let i2=b.inertia
		let m1=a.mass
		let m2=b.mass
		

		let numerator=
			myVector.dot(myVector.cross(w1,r1),n)-
			myVector.dot(myVector.cross(w2,r2),n)+
			myVector.dot(v1,n)-
			myVector.dot(v2,n)
		let denominator=
			myVector.abs(myVector.cross(r1,n))**2/i1+
			myVector.abs(myVector.cross(r2,n))**2/i2+
			myVector.abs(n)**2/m1+
			myVector.abs(n)**2/m2
		
		let k=-(R+1)*numerator/denominator
		return k
	}
	force_object(obj,force_point,impulse){
		//force_point為座標
		//以施力點為參考點
		let d1=myVector.minus(obj.position,force_point)
		//位移X衝量=角動量變化量
		let d1Xj=myVector.cross(d1.concat([0]),impulse.concat([0]))
		//改變角速度(使角動量守恆)
		obj.omega=myVector.add(obj.omega,myVector.scale(d1Xj,-1/obj.inertia))
		//改變速度
		obj.velocity=myVector.add(obj.velocity,myVector.scale(impulse,1/obj.mass))

	}
	force_object_fixed(obj,point,impulse){
		//point為obj的施力點對obj中心的位移(角位置=0時)
		//以施力點為參考點
		let d1=myVector.rotate(point,obj.angle+Math.PI)
		//位移X衝量=角動量變化量
		let d1Xj=myVector.cross(d1.concat([0]),impulse.concat([0]))
		//改變角速度(使角動量守恆)
		obj.omega=myVector.add(obj.omega,myVector.scale(d1Xj,-1/obj.inertia))
		//改變速度
		obj.velocity=myVector.add(obj.velocity,myVector.scale(impulse,1/obj.mass))
	}
	static draw_helper(obj,color,fill=true,through=1,ctx_=ctx){
		ctx_.globalAlpha=through
		ctx_.fillStyle=color
		ctx_.strokeStyle=color
		ctx_.save()
		ctx_.translate(obj.position[0],obj.position[1])
		ctx_.rotate(obj.angle)
		ctx_.beginPath()
		if(obj.type==='ball'){
			//留一個缺口以便觀察旋轉
			ctx_.arc(0,0,obj.radius,0.01,Math.PI*2-0.01)
			ctx_.lineTo(0,0)
			
		}else if(obj.type==='polygon'){
			ctx_.moveTo(obj.points[0][0],obj.points[0][1])
			for(let i=1;i<obj.points.length;i++){
				ctx_.lineTo(obj.points[i][0],obj.points[i][1])
			}
		}
		if(fill){
			ctx_.fill()	
		}else{
			ctx_.stroke()
		}
		ctx_.closePath() 
		ctx_.restore()
		ctx_.globalAlpha=1
	}
	static spring_drawer(spring,line_width=3,discolor_range=20,compress_color='blue',stretch_color='red',ctx_=ctx){
		let pA=myVector.add(spring.a.position,myVector.rotate(spring.ap,spring.a.angle))  
		let pB=myVector.add(spring.b.position,myVector.rotate(spring.bp,spring.b.angle))
		let dis=myVector.abs(myVector.minus(pA,pB))
		ctx_.beginPath()
		ctx_.moveTo(pA[0],pA[1]) 
		ctx_.lineTo(pB[0],pB[1])
		//在範圍內依比例變色
		let stretch=dis-spring.origin_dis
		let por=stretch/discolor_range
		if(por>0.5){por=0.5}		
		if(por<-0.5){por=-0.5}	
		ctx_.lineWidth=line_width	
		ctx_.globalAlpha=1
		ctx_.strokeStyle=stretch_color
		ctx_.stroke()
		ctx_.globalAlpha=0.5-por
		ctx_.strokeStyle=compress_color
		ctx_.stroke()
		ctx_.globalAlpha=1

		
	}
}

class inertiaCalculator{
	constructor(){

	}
	static divide(points=[],mass=0){
		//將凸多邊形切成數個三角形
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
		//每個三角形的前三項為三個點，第四項為質量(總質量*占總面積比例)
		return tris
	}
	
	
	static inertia_of_triangle(tri){
		//取得轉移矩陣(旋轉至v01與y軸同向)
		let v01=myVector.minus(tri[1],tri[0])
		let deg=Math.acos(myVector.dot(v01,[0,1])/myVector.abs(v01))*Math.sign(v01[0])
		let tm=[[Math.cos(deg),-Math.sin(deg)],
				[Math.sin(deg),Math.cos(deg)]]
		//旋轉三角型
		let ps=tri.slice(0,3)
		for(let i in ps){
			ps[i]=myMatrix.matrixMultiplyVector(tm,ps[i])
		}
	
		//代入公式計算轉動慣量
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
		//切成數個三角形分別計算轉動慣量再加總
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

