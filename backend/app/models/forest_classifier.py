import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

class Forest:
    def __init__(self):
        self.model = None


    def prepare_rf(self, data):
        df = pd.read_csv("realistic_optometry_data_10000.csv", delimiter=",")
        df['Employed'] = df['Employed'].apply(lambda x: 1 if x == 'Y' else 0)
        df['Benefits'] = df['Benefits'].apply(lambda x: 0 if x == 'Y' else 1)
        df['Driver'] = df['Driver'].apply(lambda x: 1 if x == 'Y' else 0)
        df['VDU'] = df['VDU'].apply(lambda x: 1 if x == 'Y' else 0)
        df['Varifocal'] = df['Varifocal'].apply(lambda x: 1 if x == 'Y' else 0)
        df['High_Rx'] = df['High_Rx'].apply(lambda x: 1 if x == 'Y' else 0)
        feature_columns = ['Age', 'Days_LPS', 'Employed', 'Benefits', 'Driver', 'VDU', 'Varifocal', 'High_Rx']
        x = df[feature_columns]
        y = (df['Spent'] >= 100).astype(int)
        return x, y


    def train_rf(self, x, y):
        x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)
        rf = RandomForestClassifier(n_estimators=100, random_state=42)
        rf.fit(x_train, y_train)
        y_pred = rf.predict(x_test)
        accuracy = accuracy_score(y_test, y_pred)
        self.model = rf
        return self.model



