
//module.exports=myMatrix

class myMatrix{
    constructor(){

    }
    static rotate(matrix){
        let matrix_=this.createMatrix(matrix[0].length,matrix.length)
        for(let i=0;i<matrix.length;i++){
            for(let y=0;y<matrix[i].length;y++){
                matrix_[y][i]=matrix[i][y]
            }
        }
        return matrix_

    }
    static create(colunm,row,init=0){
        let arr=[]
        for(let i=0;i<colunm;i++){
            let one_colunm=[]
            for(let i=0;i<row;i++){
                one_colunm.push(init)
            }
            arr.push(one_colunm)
        }

        return arr
    }
    static multiply(m1,m2){
        let nm=this.create(m1.length,m2[0].length)
        for(let i=0;i<nm.length;i++){
            for(let y=0;y<nm[0].length;y++){
                let colunm=m1[i]
                let row=[]
                for(let k of m2){
                    row.push(k[y])
                }
                let ad=0
                for(let j=0;j<row.length;j++){
                    ad+=colunm[j]*row[j]
                }

                
                nm[i][y]=ad
                
            }
        }
        return nm
    }
    static matrixMultiplyVector(mm,vv){
        let vm=this.vectorToMatrix(vv)
        let ans=this.multiply(mm,vm)
        return this.matrixToVector(ans)

    }
    static matrixToVector(m1){
        let vv=[]
        for(let i of m1){
            for(let y of i){
                vv.push(y)
            }
        }
        return vv
    }
    static vectorToMatrix(vector){
        let mm=[]
        for(let i of vector){
            mm.push([i])
        }
        
        return mm

    }

    static determinant(matrix){
        let nn=matrix.length
        if(nn===1){
            return matrix[0][0] 
        }

        let ans=0

        for(let i=0;i<nn;i++){
            let isminus=-((i%2)*2-1)//+-1
            let matrix_=this.shallowCopy(matrix)
            matrix_.splice(i,1)
            for(let i of matrix_){
                i.splice(0,1)
            }
            ans+=isminus*matrix[i][0]*this.determinant(matrix_)
        }
        
        return ans
    }
    static shallowCopy(obj){
        return JSON.parse(JSON.stringify(obj))
    }
}

