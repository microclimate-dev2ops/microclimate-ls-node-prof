/********************************************************************************
 * Licensed Materials - Property of IBM "Restricted Materials of IBM"
 *
 * Copyright IBM Corp. 2019 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 ******************************************************************************/
'use strict';

import * as testRunner from 'vscode/lib/testrunner';

testRunner.configure({
  ui: 'bdd',
  useColors: true,
  timeout: 100000
});

module.exports = testRunner;
