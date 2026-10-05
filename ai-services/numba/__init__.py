"""
Numba lightweight compatibility stub for SHAP TreeExplainer.
"""
def njit(*args, **kwargs):
    if len(args) == 1 and callable(args[0]):
        return args[0]
    def decorator(func):
        return func
    return decorator

jit = njit
prange = range
