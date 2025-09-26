// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

# Parse the configuration value from a given `AppSetting` row based on its type.
#
# + row - The configuration setting record that contains the key, raw value, and type.
# + return - The parsed configuration value as a `boolean`, `string`, or `int`, or an `error` if parsing fails.
public isolated function parseConfigValue(AppSetting row) returns boolean|string|int|error {
    if row.'type == "boolean" {
        return row.value == "true";
    } else if row.'type == "int" {
        return int:fromString(row.value.toString());
    } else {
        return row.value;
    }
}
