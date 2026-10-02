import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:codebridge_native/core/editor.dart';
import 'package:codebridge_native/main.dart';
void main(){
 test('Editor outdent never consumes preceding line',(){final c=CodeController(text:'a\n    b');c.selection=const TextSelection.collapsed(offset:7);c.indent(true);expect(c.text,'a\nb');expect(c.selection.baseOffset,3);});
 testWidgets('First-launch language selection renders bundled scripts',(tester)async{
 await tester.pumpWidget(const CodeBridge(first:true));expect(find.text('English'),findsOneWidget);expect(find.text('اردو'),findsOneWidget);expect(find.text('中文'),findsOneWidget);
 });
}
