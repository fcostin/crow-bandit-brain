{
  function makeName(result) {
    const chars = [result[0]].concat(result[1]);
    return chars.join("");
  }
  
  function makeFloat(result) {
    const chars = [result[0]].concat(result[1]);
    return parseFloat(chars.join(""));
  }
}

Start
    = ScenarioDefn*

ScenarioDefn
    = scenario_name:Name _ probability:Decimal _ generators:Generator* _ {
        return {
          "scenario_name": scenario_name,
          "probability": probability,
          "generators": generators,
        };
      }

Name "name"
    = name:([A-Za-z-_][A-Za-z0-9-_]*) { return makeName(name); }

Decimal "decimal"
    = x:([0-9]+("."[0-9]+)) { return makeFloat(x); }

Generator
    = variable_name:Name "~" distribution:Distribution _ {
        return {
            "variable_name": variable_name,
            "distribution": distribution,
        };
      }

Distribution
    = function_name:Name "(" param_bindings:ParamBindings ")" {
        return {
            "func": function_name,
            "args": param_bindings,
        }
      }

ParamBindings
    = head:ParamBinding tail:("," _ ParamBinding)* {
        return tail.reduce(function(acc, elem) {
          return acc.concat(elem[2]);
        }, [head]);
      }

ParamBinding
    = param_name:Name "=" param_value:Decimal {
        return {
            "k":param_name,
            "v":param_value,
        }
    }

_ "whitespace"
    = [ \t\n\r]*