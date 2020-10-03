'use strict';

/*  LinUCB with disjoint linear models.
 *  Ref: Algorithm 1, http://rob.schapire.net/papers/www10.pdf
 *
 *  Implementation
 *  https://github.com/scijs
 */

import * as qr from 'ndarray-householder-qr';
import * as ndarray from 'ndarray';
import * as ops from 'ndarray-ops';
import dger from 'ndarray-blas-dger';
import {axpy, dot} from 'ndarray-blas-level1';

const zeros = function(shape) {
    var n = 1;
    for (const dim of shape) {
        n *= dim;
    }
    return ndarray(new Float64Array(n), shape);
}

const asarray = function(shape, data) {
    return ndarray(new Float64Array(data), shape);
}

const clone = function(src) {
    const dst = zeros(src.shape);
    ops.assign(dst, src);
    return dst;
}
const eye = function(d) {
    const shape = [d, d];
    const a = zeros(shape);
    for (var i = 0; i < d; i++) {
        a.set(i, i, 1.0)
    }
    console.log("eye: " + a); // XXX
    return a;
}

const qr_invert = function(A) {
    const d = A.shape[0];
    let QR = clone(A);
    let R_diag = zeros([d]);
    qr.factor(QR, R_diag);
    const solve = function(y) {
        let x = clone(y);
        qr.solve(QR, R_diag, x);
        return x;
    }
    return solve;
};

// LinUCB with disjoint linear models.
// Ref: Algorithm 1, http://rob.schapire.net/papers/www10.pdf


// input parameters:
//   a: scalar expore-exploit tradeoff parameter
//   d: integer, indicating feature vector dimension
//   actions: list of actions

function NewLinUCB(alpha, d, actions) {
    const obj = {
        alpha: alpha,
        d: d,
        actions: actions,

        A_by_a: new Map(),
        b_by_a: new Map(),

        // x must be a d-dimensional array
        // Returns a _distribution_ over actions encoded as a
        // Map: action -> preference. Actions with higher
        // preference values are more preferred. If there is
        // a unique action with maximal preference then that
        // action is indicated as chosen, otherwise ties between
        // actions with maximal preference should be broken randomly.
        chooseAction: function(x) {
            const p_by_a = new Map();

            for(const a of this.actions) {
                if (!this.A_by_a.has(a)) {
                    // initialise A to d-dimensional identity matrix
                    this.A_by_a.set(a, eye(this.d));
                    
                    // initialise b to d-dimensional zero vector
                    this.b_by_a.set(a, zeros([this.d]));
                }
                const A = this.A_by_a.get(a);
                const b = this.b_by_a.get(a);
                const inv_A = qr_invert(A);
                
                // theta := A^{-1} b
                const theta = inv_A(b);
                
                // p := theta^t x + alpha * sqrt(x^t A^{-1} x)
                const p = dot(theta, x) + this.alpha * Math.sqrt(dot(x, inv_A(x)));
                
                p_by_a.set(a, p);
            }
            return p_by_a;
        },

        // x must be the same feature vector as passed to chooseAction
        // a_star is action that was performed
        // r is the scalar reward value
        updateReward: function(x, a_star, r) {
            // A <- A + outer(x, x^T)
            dger(1, x, x, this.A_by_a.get(a_star)); // BLAS Level 2 DGER

            // b <- b + r * x
            axpy(r, x, this.b_by_a.get(a_star));
        },
    };
    return obj;
};

export { NewLinUCB, asarray, zeros, eye, clone }