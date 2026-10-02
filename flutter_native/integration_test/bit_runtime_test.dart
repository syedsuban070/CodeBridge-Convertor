// Device-only: requires Rive's platform layout library, absent in flutter_tester.
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rive/rive.dart';
import 'package:integration_test/integration_test.dart';
void main(){ IntegrationTestWidgetsFlutterBinding.ensureInitialized();
 test('Bundled Bit imports with required states',()async{
 await RiveFile.initialize(); final bytes=await rootBundle.load('assets/animations/bit.riv');final f=RiveFile.import(bytes);final board=f.mainArtboard;
 expect(board.name,'Bit');expect(board.animations.length,7);
 final m=StateMachineController.fromArtboard(board,'BitMentor');expect(m,isNotNull);
 for(final trigger in ['pythonSyntax','compileFailed','success','memoryWarning','bossPass','bossFail']){expect(m!.findInput<bool>(trigger),isNotNull);}m?.dispose();
 });
}
