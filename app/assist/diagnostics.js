(function(root){
'use strict';
const rules=[
[/expected ['"]?;|expected ';'/i,'Missing semicolon','C and C++ statements usually end with a semicolon. Inspect the reported line and the line immediately above it.','int total = 42;'],
[/undeclared identifier|was not declared|NameError/i,'Unknown name','This name has not been declared in the current scope. Check spelling, capitalization, imports and where the variable is created.','Declare the variable before using it; check the exact name.'],
[/IndentationError|TabError|expected an indented block/i,'Indentation mismatch','Python uses indentation to group statements. Use consistent spaces and indent the body after if, for, while, def and class.','if ready:\n    print("Ready")'],
[/SyntaxError|invalid syntax/i,'Syntax error','The parser cannot read this statement. Check colons, closing brackets, quotes and the preceding line.','if score > 10:\n    print(score)'],
[/ZeroDivisionError|division by zero/i,'Division by zero','The divisor is zero. Check or validate it before division; decide how your program should handle zero.','if divisor != 0:\n    result = value / divisor'],
[/IndexError|out of bounds|memory access out of bounds/i,'Index or memory error','An index or pointer may refer outside its valid range. For a sequence of length n, valid indices run from 0 through n - 1. Check empty collections too.','if 0 <= index < len(values):\n    print(values[index])'],
[/TypeError|incompatible.*type|invalid operands/i,'Type mismatch','The operation received values with incompatible types. Inspect the types and convert explicitly only when that matches your intent.','age = int(input())  # input() returns text'],
[/ValueError/i,'Invalid value','The type may be correct but the value is not accepted—for example int("hello"). Validate input and handle invalid values.','try:\n    number = int(input())\nexcept ValueError:\n    print("Enter a whole number")'],
[/ModuleNotFoundError|No module named|file not found/i,'Missing module or header','Check the file name and import/include path. Python includes NumPy, SymPy and mpmath. C and C++ include cJSON.h. Other native dependencies are not automatically available.','Python: import numpy as np\nC++: #include <cJSON.h>'],
[/undefined symbol|undefined reference/i,'Linker error','A declaration was found but the implementation could not be linked. Include the matching source file in your project and check the function signature.','Keep one main() per C/C++ project; add every required .c or .cpp source file.'],
[/redefinition|duplicate symbol/i,'Duplicate definition','The same symbol is defined more than once. Check for multiple main functions or function bodies defined in headers without appropriate guards/inline.','Each executable project needs exactly one main().'],
[/EOFError|EOF when reading/i,'Input ran out','The program requested more input than the Input screen contains. Supply every required line before Run.','If your code calls input() twice, supply two lines.'],
[/expected.*[)}]|unterminated|missing terminating/i,'Unclosed bracket or string','A bracket or quoted string was opened without its matching closing character. Start at the reported line, then inspect earlier lines.','Match (), [] and {}. Close each string with the same quote type.'],
[/Output limit/i,'Too much output','An output loop exceeded the app limit. Check that the loop stops and reduce printed data.','Print a summary or a small sample instead of every iteration.']
];
const roasts=[
'Bhai, semicolon ko chhutti pe bhej diya? Compiler tera rishtedaar nahi jo khud samajh le!',
'Yeh code hai ya biryani mein ketchup? Chal, pehle error wali line seedhi kar.',
'Code ne phir se dhoka de diya, yaar. Kachra logic saaf karte hain—tu kar lega!',
'Wah ustad, bug ko permanent naukri de di? Ab isko nikaalte hain.',
'Bakwas syntax ne compiler ka dimagh paka diya. Neeche wali hint dekh, phir dobara chala.'
];
function explain(text){const line=String(text).match(/(?:^|\n)([^\n:]+):(\d+):(\d+):/)||String(text).match(/File "([^"]+)", line (\d+)/);const match=rules.find(r=>r[0].test(text));return {title:match?.[1]||'Let’s inspect this error',explanation:match?.[2]||'Read the first error before the later ones: one early mistake can cause many follow-up messages. Compare the reported line with your intended behavior.',example:match?.[3]||'Try a smaller input or isolate the failing statement. Then run again.',file:line?.[1]||'',line:line?Number(line[2]):null};}
function roast(seed=0){return roasts[Math.abs(seed)%roasts.length];}
const api={explain,roast};if(typeof module!=='undefined')module.exports=api;else root.CBDiagnostics=api;
})(globalThis);
