
/*
require:
    myMatrix.js
*/    

/*
let myMatrix=require('./myMatrix')
module.exports=myVector
*/

class myVector{
	constructor(){
	}

    /*********FOR ALL VECTORS**********/



	//return v1+v2
	static add(){
        let vv=[]
        for(let i in arguments[0]){
            let n=0
            for(let y of arguments){
                n+=y[i]
            }
            vv.push(n)
        }
        
		return vv
	}
	//return v1-v2
	static minus(v1,v2){
		let vv=[]
        for(let i in v1){
            vv.push(v1[i]-v2[i])
        }
		return vv
	}
	//return number*v1
	static scale(v1,number){
		let vv=[]
        for(let i in v1){
            vv.push(v1[i]*number)
        }
		return vv
	}
	//return v1 dot v2
	static dot(v1,v2){
		let nn=0
        for(let i in v1){
            nn+=v1[i]*v2[i]
        }
		return nn
	}
	
	//return |v1|
	static abs(v1){
        let nn=0
        for(let i in v1){
            nn+=v1[i]**2
        }
		return Math.sqrt(nn)
	}
	//return whether v1 equal to v2
	static equal(v1,v2){
		if(JSON.stringify(v1)===JSON.stringify(v2)){
			return true
		}else{
			return false
		}
	}

    //cast v1 onto base in 90 degree
    static orthographicProjection(v1,base){
        let vv=this.scale(base,this.dot(v1,base)/this.abs(base)**2)
        return vv
    }

    //transform v1 to a matrix
    static toMatrix(v1,colunm,row=v1.length/colunm){
        if(row*colunm!==v1.length){
            console.error('the size of matrix is not available')
            return false
        }else{
            let matrix_=[]
            for(let i=0;i<colunm;i++){
                let arr=[]
                for(let y=0;y<row;y++){
                    arr.push(v1[i*row+y])
                }
                matrix_.push(arr)
            }
            return matrix_
        }

    }
    static ArithmeticSequence(start,end,dis=1){
        let arr=[]
        for(let i=start;i<end;i+=dis){
            arr.push(i)
        }
        return arr
    }
    
    
    
    
    
    /********ONLY VECTOR2*******/
    
    
    //return angle(rad) of v1
    static rotate(v1,angle){
        let s=Math.sin(angle)
        let c=Math.cos(angle)
        let x=c*v1[0]-s*v1[1]
        let y=s*v1[0]+c*v1[1]
        return[x,y]
    }
	static deg(v1){
		if(v1.length===2){
            return Math.atan2(v1[1],v1[0])
        }
        
	}
    //set the vector by polar coordinate
	static set(long,deg){
		let x=long*Math.cos(deg)
		let y=long*Math.sin(deg)
		return [x,y]
	}
	//return new vector which is set by v1 and deg(rad)
	static set_deg(v1,deg){
		return [this.abs(v1)*Math.cos(deg),this.abs(v1)*Math.sin(deg)]
	}
	//divide v1 into two vectors with different direction
	static divide2(v1,deg,add_deg=Math.PI/2){
		let alpha=deg-this.deg(v1)
		let beta=this.deg(v1)-(deg+add_deg)
		let normal=this.set(this.abs(v1)*Math.sin(beta)/Math.sin(Math.PI-alpha-beta),deg)
		let tangent=this.set(this.abs(v1)*Math.sin(alpha)/Math.sin(Math.PI-alpha-beta),deg+add_deg)
		return {normal:normal,tangent:tangent}
	}



    /*****ONLY VECTOR3*******/
    //return v1 cross v2
    static cross(v1,v2){
		let x=myMatrix.determinant([[v1[1],v1[2]],[v2[1],v2[2]]])
		let y=myMatrix.determinant([[v1[2],v1[0]],[v2[2],v2[0]]])
		let z=myMatrix.determinant([[v1[0],v1[1]],[v2[0],v2[1]]])
		return [x,y,z]
	}

    //rotate v1 by axis for theta(rad)
    static rotateOnAxis(axis,v1,theta){
        let tangent=this.orthographicProjection(v1,axis)
        let normal=this.minus(v1,tangent)
        let vrot=this.add(this.scale(normal,Math.cos(theta)),this.scale(this.cross(axis,v1),Math.sin(theta)/this.abs(axis)))
        return this.add(tangent,vrot)
    }
    
}


